'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Route,
  Users,
  GraduationCap,
  CalendarCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SchoolOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/school/data')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load school transportation records');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#006B2F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading school operations records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-rose-900">Unable to Load Operations Data</h3>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, routes = [], trips = [], school } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
            Operations Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {school?.name || 'School Transport Console'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time route visibility, driver assignments, and student transit records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/school/fleet"
            className="px-4 py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open Live Fleet</span>
          </Link>
          <Link
            href="/school/routes"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Manage Routes</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Routes</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B2F] flex items-center justify-center">
              <Route className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{metrics?.activeRoutes ?? 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Total: {metrics?.totalRoutes ?? 0} mapped</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Trips</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B2F] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{metrics?.activeTrips ?? 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Currently on road</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B2F] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{metrics?.enrolledStudents ?? 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Assigned to transport</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B2F] flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{metrics?.completedTrips ?? 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Safely arrived</span>
        </div>
      </div>

      {/* Main Content Grid: Active Trips / Routes vs Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Trips & Routes */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Today&apos;s Active &amp; Recent Runs</h3>
                <p className="text-xs text-slate-500">Live operational status across assigned school corridors</p>
              </div>
              <Link href="/school/trips" className="text-xs font-bold text-[#006B2F] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {trips.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Trips Active Right Now</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When drivers start their morning or afternoon assigned school runs, live telemetry will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {trips.slice(0, 5).map((trip: any) => (
                  <div key={trip.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {trip.routes?.code || 'Route'} • {trip.routes?.name || 'School Run'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trip.state === 'in_progress'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : trip.state === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {trip.state === 'in_progress' ? '● Live' : trip.state}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vehicle: {trip.vehicles?.registration_number || 'Unassigned'} • Driver:{' '}
                        {trip.drivers?.profiles?.full_name || 'Assigned Driver'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right text-xs">
                      <span className="text-slate-500 block">Boarded</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {trip.students_boarded_count ?? 0} students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mapped Routes List */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campus Transport Routes</h3>
                <p className="text-xs text-slate-500">Registered corridors and scheduled pickup stops</p>
              </div>
              <Link href="/school/routes" className="text-xs font-bold text-[#006B2F] hover:underline flex items-center gap-1">
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {routes.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Route className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Routes Configured Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Set up your school route corridors and pickup landmarks to assign vehicles and drivers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {routes.map((route: any) => (
                  <div key={route.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-[#006B2F]">{route.code}</span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">{route.direction}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{route.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{route.stops_count || 0} stops configured</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Setup & Enrolled Roster */}
        <div className="lg:col-span-4 space-y-6">
          {/* Operations Quick Links */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/school/fleet"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-[#006B2F] transition-all text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-[#006B2F]" />
                  <span>Live Operations Map</span>
                </span>
                <span>→</span>
              </Link>

              <Link
                href="/school/drivers"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-[#006B2F] transition-all text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#006B2F]" />
                  <span>Driver &amp; Vehicle Roster</span>
                </span>
                <span>→</span>
              </Link>

              <Link
                href="/school/students"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-[#006B2F] transition-all text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-[#006B2F]" />
                  <span>Student Attendance Logs</span>
                </span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-md border border-emerald-800/40">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Multi-Tenant School Isolation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All routes, student manifests, and telemetry records are strictly scoped to{' '}
              <strong>{school?.name || 'your institution'}</strong> via backend authorization checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
