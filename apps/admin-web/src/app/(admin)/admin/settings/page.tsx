'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">System Settings &amp; Operational Thresholds</h1>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Deployment zone configurations, SLA tolerance rules, and telemetry ingestion frequencies.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors text-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Operational parameters updated across all dispatch clusters.</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Organization Zone */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">
            Regional Zone &amp; Timezone
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Operating Transit Zone</label>
              <input
                type="text"
                disabled
                defaultValue="Hyderabad Central & IT Corridor (TS-09/10)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-300 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Standard Timezone (Mandatory)</label>
              <input
                type="text"
                disabled
                defaultValue="Asia/Kolkata (IST — UTC+05:30)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-300 text-xs font-semibold font-mono"
              />
            </div>
          </div>
        </div>

        {/* SLA & Tolerances */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">
            SLA &amp; Delay Alert Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Delay Warning Threshold</label>
              <select
                defaultValue="5"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs font-semibold"
              >
                <option value="5">5 minutes behind schedule</option>
                <option value="8">8 minutes behind schedule</option>
                <option value="10">10 minutes behind schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">GPS Telemetry Interval</label>
              <select
                defaultValue="5"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs font-semibold"
              >
                <option value="3">Every 3 seconds (High precision)</option>
                <option value="5">Every 5 seconds (Standard)</option>
                <option value="10">Every 10 seconds (Battery saving)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Speed Governor Cap</label>
              <select
                defaultValue="40"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs font-semibold"
              >
                <option value="40">40 km/h (Strict School Zone)</option>
                <option value="50">50 km/h (Arterial Roads)</option>
              </select>
            </div>
          </div>
        </div>

        {/* API & Services Status */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-white">
                API &amp; Service Integrations
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Inspect live status of geospatial map tile providers, Supabase database, SMS OTP gateways, and realtime fleet sync.
              </p>
            </div>
            <Link
              href="/admin/settings/integrations"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-lg border border-slate-700 transition-colors text-xs"
            >
              <span>Manage Integrations</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

