'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function AdminVehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/vehicles" className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white font-mono">TS09-TR-102</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Active In Transit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Force Traveller 18-Seater · Vehicle ID: {vehicleId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Assigned Driver</span>
          <p className="text-sm font-extrabold text-white">Ravi Kumar</p>
          <p className="text-[11px] text-slate-400">+91 98765 00001</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Capacity</span>
          <p className="text-sm font-extrabold text-white font-mono">18 Seats (16 Usable)</p>
          <p className="text-[11px] text-slate-400">Child safety belts equipped</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Speed Governor</span>
          <p className="text-sm font-extrabold text-emerald-400 font-mono">Capped at 40 km/h</p>
          <p className="text-[11px] text-slate-400">RTA Telangana certified</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fitness Certificate</span>
          <p className="text-sm font-extrabold text-white">Valid till Dec 2027</p>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline" /> 100% Compliant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">Compliance Documents</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Commercial Fitness &amp; Pollution Test</p>
                <p className="text-[11px] text-slate-400">Certificate #TS09-FC-2024-8891</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Commercial School Bus Insurance</p>
                <p className="text-[11px] text-slate-400">Comprehensive coverage up to ₹50L</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Active</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">Assigned Route Network</h3>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Route M-01 Morning &amp; Afternoon Loop</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
            <p className="text-[11px] text-slate-400">Olive Mount Global School · 16 registered student stops</p>
          </div>
        </div>
      </div>
    </div>
  );
}
