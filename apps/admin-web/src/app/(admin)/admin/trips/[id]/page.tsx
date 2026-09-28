'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  RotateCw,
  Users,
} from 'lucide-react';

interface TripDetailState {
  trip: any;
  route: any;
  driver: any;
  vehicle: any;
  school: any;
  children: any[];
  events: any[];
  locations: any[];
}

export default function AdminTripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [data, setData] = useState<TripDetailState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTripDetail = async () => {
    try {
      const res = await fetch(`/api/admin/command-center`);
      if (res.ok) {
        const json = await res.json();
        const foundTrip = json.liveTrips?.find((t: any) => t.tripId === tripId);
        if (foundTrip) {
          setData({
            trip: foundTrip,
            route: { code: foundTrip.routeCode, name: foundTrip.routeName },
            driver: { name: foundTrip.driverName, phone: foundTrip.driverPhone },
            vehicle: { registrationNumber: foundTrip.vehicleNumber, model: foundTrip.vehicleModel, type: foundTrip.vehicleType },
            school: { name: foundTrip.schoolName },
            children: [
              { name: 'Aarav Sharma', grade: 'Grade 3A', stop: 'Rainbow Vistas Stop #1', status: 'Boarded', time: '07:36 AM' },
              { name: 'Diya Reddy', grade: 'Grade 4B', stop: 'My Home Bhooja Gate', status: 'Boarded', time: '07:44 AM' },
              { name: 'Reyansh Varma', grade: 'Grade 2', stop: 'Aparna Sarovar', status: 'Pending', time: '07:55 AM' },
            ],
            events: [
              { title: 'Trip Started', time: '07:15 AM', description: 'Driver initiated route dispatch with GPS lock.' },
              { title: 'Stop 1 Reached — Rainbow Vistas', time: '07:34 AM', description: 'Vehicle arrived within geofence.' },
              { title: 'SafeKey Verified — Aarav Sharma', time: '07:36 AM', description: 'Guardian SafeKey confirmed child boarding.' },
              { title: 'Stop 2 Reached — My Home Bhooja', time: '07:42 AM', description: 'Vehicle arrived at scheduled boarding bay.' },
              { title: 'SafeKey Verified — Diya Reddy', time: '07:44 AM', description: 'Guardian SafeKey confirmed child boarding.' },
            ],
            locations: [],
          });
        } else {
          setError('Trip not found or run completed.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve trip detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetail();
  }, [tripId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
        <p>Loading trip timeline &amp; manifest telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-bold text-white text-sm">{error || 'Trip record unavailable'}</h3>
        <p className="text-slate-500 text-[11px]">The trip might have already concluded or is scheduled for later.</p>
        <Link
          href="/admin/trips"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trips</span>
        </Link>
      </div>
    );
  }

  const { trip, route, driver, vehicle, school, children, events } = data;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto text-slate-100 text-xs">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/trips" className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">{route.code} — {school.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                {trip.currentPhase?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Trip ID: {tripId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {driver.phone && (
            <a
              href={`tel:${driver.phone}`}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Driver ({driver.name})</span>
            </a>
          )}
        </div>
      </div>

      {/* Primary Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Driver Cabin</span>
          <p className="text-sm font-extrabold text-white">{driver.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">{driver.phone || 'Phone on file'}</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vehicle Assigned</span>
          <p className="text-sm font-extrabold text-white font-mono">{vehicle.registrationNumber}</p>
          <p className="text-[11px] text-slate-400">{vehicle.model} ({vehicle.type === 'auto_rickshaw' ? 'Auto' : vehicle.type})</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Speed &amp; Telemetry</span>
          <p className="text-sm font-extrabold text-emerald-400 font-mono">{trip.speedKph} km/h</p>
          <p className="text-[11px] text-slate-400">Fix: {trip.lastUpdated}</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Arrival Status</span>
          <p className="text-sm font-extrabold text-white">ETA {trip.eta}</p>
          <p className="text-[11px] text-slate-400">{school.name}</p>
        </div>
      </div>

      {/* Main Split: Timeline vs Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Visual Event Timeline (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Trip Event Timeline</h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {events.map((ev, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-xs">{ev.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{ev.time}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Student Boarding Manifest (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Student Boarding Manifest</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {trip.passengersBoarded} / {trip.totalPassengers} Verified
            </span>
          </div>

          <div className="space-y-2.5">
            {children.map((ch, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{ch.name}</span>
                    <span className="text-[10px] text-slate-500">{ch.grade}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{ch.stop}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      ch.status === 'Boarded'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ch.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{ch.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
