'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-5 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Transportation Intelligence &amp; Analytics</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              Hyderabad Corridor
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Aggregated SLA trends, route efficiency metrics, vehicle load factors, and arrival accuracy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Fleet On-Time Performance</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">98.2%</p>
          <p className="text-slate-400 text-[11px]">+1.4% improvement compared to previous billing cycle</p>
        </div>

        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">SafeKey Boarding Accuracy</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">100%</p>
          <p className="text-slate-400 text-[11px]">Zero unverified boarding attempts recorded this term</p>
        </div>

        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Average Trip Transit Time</span>
          <p className="text-2xl font-black text-white font-mono">28.4 min</p>
          <p className="text-slate-400 text-[11px]">Optimal travel duration under 35-minute safety threshold</p>
        </div>
      </div>
    </div>
  );
}
