'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck } from 'lucide-react';

interface ComplianceItem {
  id: string;
  name: string;
  type: 'driver' | 'vehicle';
  documentType: string;
  submittedAt: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export default function AdminCompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([
    {
      id: 'k-1',
      name: 'Anand Varma',
      type: 'driver',
      documentType: 'Police Verification & Commercial Driving License',
      submittedAt: 'Today, 06:30 AM',
      status: 'pending_review',
    },
    {
      id: 'k-2',
      name: 'TS09-TR-120 (Force Traveller)',
      type: 'vehicle',
      documentType: 'Commercial Fitness Certificate & Speed Governor Test',
      submittedAt: 'Yesterday, 04:15 PM',
      status: 'pending_review',
    },
  ]);

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const item = items.find((i) => i.id === id);
      if (item) {
        await fetch('/api/admin/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: item.type === 'driver' ? 'approve_driver' : 'approve_vehicle',
            targetId: id,
            note: `${newStatus} during Central Operations compliance review.`,
          }),
        });
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    } catch {
      alert('Failed to process compliance approval.');
    }
  };

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Compliance &amp; Verification Center</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {items.filter((i) => i.status === 'pending_review').length} Pending Review
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Audited document inspection for commercial driver licenses, police records, speed governors, and RTA fitness certificates.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                    {item.type}
                  </span>
                  <span className="font-extrabold text-sm text-white">{item.name}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-1">{item.documentType}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Submitted: {item.submittedAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {item.status === 'pending_review' ? (
                <>
                  <button
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-red-950 text-red-400 border border-slate-800 hover:border-red-800 rounded-lg font-semibold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors"
                  >
                    Verify &amp; Approve
                  </button>
                </>
              ) : (
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {item.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
