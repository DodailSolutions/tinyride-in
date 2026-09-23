'use client';

import React, { useState } from 'react';

interface SafetyException {
  id: string;
  tripId: string;
  tripNumber: string;
  childName: string;
  exceptionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  slaMinutesRemaining: number;
  reportedAt: string;
  notes: string;
}

interface IncidentCase {
  id: string;
  reference: string;
  title: string;
  severity: string;
  state: 'reported' | 'investigating' | 'closed';
  createdAt: string;
  closedBy?: string;
  closureNote?: string;
}

export default function SafetyTriagePage() {
  const [exceptions, setExceptions] = useState<SafetyException[]>([
    {
      id: 'exc-1',
      tripId: 'trip-3',
      tripNumber: 'TRIP-HYD-003',
      childName: 'Aarav Sharma',
      exceptionType: 'FAILED_OTP_LOCKOUT',
      severity: 'high',
      status: 'open',
      slaMinutesRemaining: 185,
      reportedAt: '2026-09-23 07:22 AM',
      notes: '3 failed OTP verification attempts at pickup stop. Driver app locked.',
    },
    {
      id: 'exc-2',
      tripId: 'trip-1',
      tripNumber: 'TRIP-HYD-001',
      childName: 'Ananya Reddy',
      exceptionType: 'DELAYED_SCHOOL_ARRIVAL',
      severity: 'medium',
      status: 'open',
      slaMinutesRemaining: 1320,
      reportedAt: '2026-09-23 07:45 AM',
      notes: 'Traffic congestion on Outer Ring Road delayed estimated arrival by 15 mins.',
    },
  ]);

  const [incidents] = useState<IncidentCase[]>([
    {
      id: 'inc-1',
      reference: 'INC-20260922-A1B2C3',
      title: 'Minor route deviation due to road construction at Hitec City',
      severity: 'low',
      state: 'closed',
      createdAt: '2026-09-22 08:15 AM',
      closedBy: 'Operator Rajesh (Hyderabad Control)',
      closureNote: 'Alternate route verified with school gate security. All children safely dropped.',
    },
  ]);

  const [selectedException, setSelectedException] = useState<SafetyException | null>(null);
  const [resolutionCode, setResolutionCode] = useState('PARENT_VERIFIED_OVERRIDE');
  const [resolutionNote, setResolutionNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleResolveException = () => {
    if (!selectedException || !resolutionNote) {
      alert('A non-empty resolution note is strictly mandatory per safety protocol.');
      return;
    }

    setExceptions(exceptions.filter((e) => e.id !== selectedException.id));
    setStatusMessage(
      `Exception ${selectedException.id} resolved with code ${resolutionCode}. Audit trail logged.`,
    );
    setSelectedException(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[16px]">emergency</span>
            Hyderabad Central Dispatch Triage Desk
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary-text tracking-tight">
            Safety Exceptions &amp; Incident Management
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Live SLA triage countdowns, failed OTP lockouts, driver route exceptions, and human-verified incident sign-offs.
          </p>
        </div>

        {/* Central Dispatch Hotline Badge */}
        <div className="flex items-center gap-3 bg-error-container text-on-error-container p-3 rounded-2xl border border-error/30 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-error text-on-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">phone_in_talk</span>
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-error">Emergency Central Dispatch</p>
            <p className="font-headline text-base font-extrabold text-primary-text">+91 40 8899 0011</p>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold">Open Exceptions</span>
            <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">{exceptions.length}</span>
            <span className="text-error text-xs font-bold">SLA Active</span>
          </div>
          <p className="text-xs text-secondary-text mt-3 pt-3 border-t border-border/40">
            Awaiting Operator Action
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold">Failed OTP Lockouts</span>
            <div className="w-10 h-10 rounded-xl bg-sun-gold/15 text-sun-gold flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">1</span>
            <span className="text-sun-gold text-xs font-bold">Driver Locked</span>
          </div>
          <p className="text-xs text-secondary-text mt-3 pt-3 border-t border-border/40">
            Automated Safety Invariant
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold">Active Incidents</span>
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">0</span>
            <span className="text-primary text-xs font-bold">All Clear</span>
          </div>
          <p className="text-xs text-secondary-text mt-3 pt-3 border-t border-border/40">
            Zero Platform Escalations
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold">Avg SLA Triage Time</span>
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">14m</span>
            <span className="text-primary text-xs font-bold">Target &lt;60m</span>
          </div>
          <p className="text-xs text-secondary-text mt-3 pt-3 border-t border-border/40">
            Operational Excellence
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-xs font-semibold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Active Exceptions Table */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 space-y-4">
        <h3 className="font-headline text-lg font-bold text-primary-text">Active Safety Exceptions Queue</h3>
        {exceptions.length === 0 ? (
          <div className="py-12 text-center text-secondary-text text-sm">
            <span className="material-symbols-outlined text-[48px] text-primary mb-2">verified</span>
            <p>All exceptions resolved. Zero safety incidents active.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-xs font-bold text-secondary-text uppercase tracking-wider">
                  <th className="pb-3">Trip ID / Passenger</th>
                  <th className="pb-3">Exception Type</th>
                  <th className="pb-3">Severity &amp; SLA</th>
                  <th className="pb-3">Reported Notes</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {exceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4">
                      <p className="font-bold text-primary-text">{exc.tripNumber}</p>
                      <p className="text-xs text-secondary-text">{exc.childName}</p>
                    </td>
                    <td className="py-4">
                      <span className="bg-surface-container-high text-primary-text px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                        {exc.exceptionType}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            exc.severity === 'critical'
                              ? 'bg-error-container text-on-error-container'
                              : exc.severity === 'high'
                              ? 'bg-sun-gold/20 text-sun-gold'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {exc.severity}
                        </span>
                        <span className="text-xs font-semibold text-error flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">timer</span>
                          {exc.slaMinutesRemaining}m left
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-secondary-text max-w-xs">{exc.notes}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setSelectedException(exc)}
                        className="bg-primary hover:bg-primary-hover text-on-primary px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        Triage &amp; Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident Audit Log */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 space-y-4">
        <h3 className="font-headline text-lg font-bold text-primary-text">Formal Incident Audit Archive</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-xs font-bold text-secondary-text uppercase tracking-wider">
                <th className="pb-3">Incident Reference</th>
                <th className="pb-3">Title &amp; Findings</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Closed By / Resolution Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4 font-mono font-bold text-primary-text text-xs">{inc.reference}</td>
                  <td className="py-4">
                    <p className="font-semibold text-primary-text">{inc.title}</p>
                    <p className="text-xs text-secondary-text">{inc.createdAt}</p>
                  </td>
                  <td className="py-4">
                    <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                      {inc.state}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-secondary-text">
                    <p className="font-bold text-primary-text">{inc.closedBy}</p>
                    <p className="mt-0.5">{inc.closureNote}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-xl border border-border space-y-4">
            <h3 className="font-headline text-lg font-bold text-primary-text">
              Resolve Safety Exception: {selectedException.id}
            </h3>
            <p className="text-xs text-secondary-text">
              Trip: <strong>{selectedException.tripNumber}</strong> &bull; Child: <strong>{selectedException.childName}</strong>
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary-text">Resolution Code</label>
              <select
                value={resolutionCode}
                onChange={(e) => setResolutionCode(e.target.value)}
                className="w-full bg-surface-container-high text-xs text-primary-text p-2.5 rounded-xl border border-border/60 outline-none font-medium"
              >
                <option value="PARENT_VERIFIED_OVERRIDE">PARENT_VERIFIED_OVERRIDE &bull; Parent verified child present</option>
                <option value="GUARDIAN_CONTACTED">GUARDIAN_CONTACTED &bull; Primary phone contact confirmed</option>
                <option value="POLICE_ESCALATION">POLICE_ESCALATION &bull; Referred to law enforcement</option>
                <option value="FALSE_ALARM">FALSE_ALARM &bull; Operator system misconfiguration</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary-text">Mandatory Operator Resolution Note *</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="State specific verified facts and supervisor sign-off..."
                className="w-full bg-surface-container-high text-xs text-primary-text p-2.5 rounded-xl border border-border/60 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedException(null)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-secondary-text text-xs font-bold hover:bg-surface-container-highest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveException}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-hover transition-all"
              >
                Sign Off &amp; Close SLA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
