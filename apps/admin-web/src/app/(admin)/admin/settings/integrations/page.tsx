'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  MapPin,
  Database,
  MessageSquare,
  Radio,
} from 'lucide-react';

interface IntegrationData {
  timestamp: string;
  system: {
    nodeEnv: string;
    appUrl: string;
    demoMode: boolean;
    devOtpBypass: boolean;
  };
  integrations: {
    maps: {
      provider: string;
      status: 'configured' | 'missing' | 'warning';
      message: string;
      keys: {
        mapbox: string | null;
        maptiler: string | null;
        carto: string | null;
      };
    };
    database: {
      status: 'connected' | 'error';
      latencyMs: number | null;
      error: string | null;
      url: string | null;
      hasServiceKey: boolean;
      hasAnonKey: boolean;
    };
    sms: {
      status: 'configured' | 'missing' | 'warning';
      message: string;
      provider: string;
      configured: boolean;
      twilioSid: string | null;
      twilioPhone: string | null;
    };
    realtime: {
      status: string;
      provider: string;
      channels: string[];
    };
  };
}

export default function IntegrationsSettingsPage() {
  const [data, setData] = useState<IntegrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch integrations status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const renderStatusBadge = (status: 'configured' | 'connected' | 'missing' | 'warning' | 'error') => {
    switch (status) {
      case 'configured':
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Configured</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-950/80 text-amber-400 border border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Development Bypass</span>
          </span>
        );
      case 'missing':
      case 'error':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-950/80 text-rose-400 border border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>Not Configured</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-slate-100 text-xs pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">API &amp; Service Integrations</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900 text-slate-400 border border-slate-800">
                Production Readiness
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Live status audit of map tile providers, Supabase database, SMS OTP gateways, and realtime channels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Checked at {lastChecked}
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-all text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test Connections</span>
          </button>
        </div>
      </div>

      {/* Grid of Integration Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Geospatial & Map Tile Providers */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Geospatial Fleet Map</h3>
                <p className="text-[11px] text-slate-400">Map tile provider &amp; coordinate rendering</p>
              </div>
            </div>
            {data && renderStatusBadge(data.integrations.maps.status)}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            {data?.integrations.maps.message || 'Loading map configuration...'}
          </p>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Active Provider</span>
              <span className="text-white font-bold uppercase">{data?.integrations.maps.provider || 'OSM'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span>
              <span className={data?.integrations.maps.keys.mapbox ? 'text-emerald-400' : 'text-slate-500'}>
                {data?.integrations.maps.keys.mapbox || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">NEXT_PUBLIC_MAPTILER_API_KEY</span>
              <span className={data?.integrations.maps.keys.maptiler ? 'text-emerald-400' : 'text-slate-500'}>
                {data?.integrations.maps.keys.maptiler || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">NEXT_PUBLIC_CARTO_API_KEY</span>
              <span className={data?.integrations.maps.keys.carto ? 'text-emerald-400' : 'text-slate-500'}>
                {data?.integrations.maps.keys.carto || 'Not set'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="font-bold text-slate-300">Tip:</span> To change providers, set{' '}
            <code className="text-emerald-400 font-mono">NEXT_PUBLIC_MAP_PROVIDER=osm|mapbox|maptiler|carto</code> in{' '}
            <code className="text-slate-300 font-mono">.env.local</code>. OpenStreetMap requires no external API keys.
          </div>
        </div>

        {/* 2. Supabase & PostGIS Database */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Supabase Database &amp; PostGIS</h3>
                <p className="text-[11px] text-slate-400">PostgreSQL spatial engine &amp; RLS policies</p>
              </div>
            </div>
            {data && renderStatusBadge(data.integrations.database.status)}
          </div>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Database Connection</span>
              <span className="text-emerald-400 font-bold">
                {data?.integrations.database.status === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Query Latency</span>
              <span className="text-white font-bold">
                {data?.integrations.database.latencyMs !== null ? `${data?.integrations.database.latencyMs} ms` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Service Role Key</span>
              <span className={data?.integrations.database.hasServiceKey ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                {data?.integrations.database.hasServiceKey ? 'Active (Admin bypass)' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Public Anon Key</span>
              <span className={data?.integrations.database.hasAnonKey ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                {data?.integrations.database.hasAnonKey ? 'Active' : 'Missing'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="font-bold text-slate-300">Schema:</span> PostGIS geospatial indexing enabled on{' '}
            <code className="text-slate-300 font-mono">telemetry_pings.location</code> and{' '}
            <code className="text-slate-300 font-mono">geofences.boundary</code>.
          </div>
        </div>

        {/* 3. Phone OTP & SMS Gateway */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">SMS &amp; Phone Verification</h3>
                <p className="text-[11px] text-slate-400">Twilio SMS gateway &amp; OTP tokens</p>
              </div>
            </div>
            {data && renderStatusBadge(data.integrations.sms.status)}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            {data?.integrations.sms.message || 'Loading SMS configuration...'}
          </p>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Provider</span>
              <span className="text-white font-bold">{data?.integrations.sms.provider}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">TWILIO_ACCOUNT_SID</span>
              <span className={data?.integrations.sms.twilioSid ? 'text-emerald-400' : 'text-slate-500'}>
                {data?.integrations.sms.twilioSid || 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">DEV_OTP_BYPASS</span>
              <span className={data?.system.devOtpBypass ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {data?.system.devOtpBypass ? 'Enabled (Dev Only)' : 'Disabled (Production Safe)'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="font-bold text-slate-300">Production Requirement:</span> For live SMS dispatch, configure{' '}
            <code className="text-slate-300 font-mono">TWILIO_ACCOUNT_SID</code>,{' '}
            <code className="text-slate-300 font-mono">TWILIO_AUTH_TOKEN</code>, and{' '}
            <code className="text-slate-300 font-mono">TWILIO_PHONE_NUMBER</code>.
          </div>
        </div>

        {/* 4. Realtime Channels & WebSocket */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Realtime Fleet Sync</h3>
                <p className="text-[11px] text-slate-400">WebSocket change streams &amp; live presence</p>
              </div>
            </div>
            {data && renderStatusBadge(data.integrations.realtime.status as any)}
          </div>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Provider</span>
              <span className="text-white font-bold">{data?.integrations.realtime.provider}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Active CDC Channels</span>
              <span className="text-emerald-400 font-bold">trips, telemetry, handovers</span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">DEMO_MODE</span>
              <span className={data?.system.demoMode ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {data?.system.demoMode ? 'Active (Mock Telemetry)' : 'Disabled (Live Database)'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="font-bold text-slate-300">Live Telemetry:</span> Subscribes to Postgres change notifications on{' '}
            <code className="text-slate-300 font-mono">telemetry_pings</code> table for sub-second fleet tracking.
          </div>
        </div>
      </div>
    </div>
  );
}
