'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminPaymentsPage() {
  const payouts = [
    { driver: 'Ravi Kumar', vehicle: 'TS09-TR-102', trips: 44, amount: '₹28,600', status: 'Disbursed', date: '28 Sep 2026' },
    { driver: 'Venkatesh Rao', vehicle: 'TS09-TR-105', trips: 42, amount: '₹22,400', status: 'Disbursed', date: '28 Sep 2026' },
    { driver: 'K. Srinivas', vehicle: 'TS10-TR-114', trips: 40, amount: '₹34,000', status: 'Processing', date: 'Pending' },
  ];

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Finance &amp; Driver Partner Payouts</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              Automated Banking Engine
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Direct bank settlements, weekly driver earnings, route completion incentives, and fuel allowances.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Weekly Disbursed</span>
          <p className="text-2xl font-black text-white font-mono">₹1,85,000</p>
          <p className="text-slate-400 text-[11px]">Direct NEFT/IMPS clearing</p>
        </div>

        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Pending Settlement</span>
          <p className="text-2xl font-black text-amber-400 font-mono">₹34,000</p>
          <p className="text-slate-400 text-[11px]">Awaiting bank reconciliation</p>
        </div>

        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Platform Reconciliation</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">100% Balanced</p>
          <p className="text-slate-400 text-[11px]">Escrow ledger verified</p>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Driver Partner</th>
              <th className="py-3 px-4">Vehicle</th>
              <th className="py-3 px-4">Completed Runs</th>
              <th className="py-3 px-4">Gross Payout</th>
              <th className="py-3 px-4">Settlement Date</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-medium">
            {payouts.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">{p.driver}</td>
                <td className="py-3.5 px-4 font-mono text-slate-300">{p.vehicle}</td>
                <td className="py-3.5 px-4 text-slate-200">{p.trips} runs</td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.amount}</td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">{p.date}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'Disbursed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
