'use client';

import React, { useState } from 'react';

interface GateException {
  id: string;
  timestamp: string;
  childName: string;
  exceptionType: 'STUDENT_ABSENT_AT_GATE' | 'UNAUTHORIZED_DRIVER_PICKUP' | 'VEHICLE_MISMATCH' | 'GATE_DELAY' | 'OTHER';
  severity: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  reportedBy: string;
  status: 'active' | 'investigating' | 'resolved';
}

export default function GateExceptionsPage() {
  const [exceptions, setExceptions] = useState<GateException[]>([
    {
      id: 'EXC-8812',
      timestamp: 'Today, 03:22 PM',
      childName: 'Aarav Sharma',
      exceptionType: 'STUDENT_ABSENT_AT_GATE',
      severity: 'high',
      notes: 'Child did not arrive at Gate 3 dismissal bay after 15 mins. Class teacher notified.',
      reportedBy: 'K. Somesh (Gate Security)',
      status: 'investigating',
    },
    {
      id: 'EXC-8805',
      timestamp: 'Today, 08:15 AM',
      childName: 'Vivaan Joshi',
      exceptionType: 'GATE_DELAY',
      severity: 'low',
      notes: 'Van delayed 12 minutes due to metro construction traffic on Financial District road.',
      reportedBy: 'N. Rama (Transport Coord)',
      status: 'resolved',
    },
  ]);

  // Form states
  const [childName, setChildName] = useState('Diya Patel');
  const [exceptionType, setExceptionType] = useState<GateException['exceptionType']>('STUDENT_ABSENT_AT_GATE');
  const [severity, setSeverity] = useState<GateException['severity']>('medium');
  const [notes, setNotes] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    const newEx: GateException = {
      id: `EXC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      childName,
      exceptionType,
      severity,
      notes: notes.trim(),
      reportedBy: 'Current Gate Officer',
      status: 'active',
    };

    setExceptions([newEx, ...exceptions]);
    setNotes('');
    setSubmittedMessage(`Safety exception ${newEx.id} logged and broadcasted to TinyRide Central Ops.`);
    setTimeout(() => setSubmittedMessage(null), 5000);
  };

  const handleResolve = (id: string) => {
    setExceptions((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, status: 'resolved' } : ex)),
    );
  };

  const getSeverityBadge = (sev: GateException['severity']) => {
    switch (sev) {
      case 'critical':
        return 'bg-danger-container text-danger-error font-extrabold border border-danger-error/30 animate-pulse';
      case 'high':
        return 'bg-danger-container/70 text-danger-error font-bold border border-danger-error/20';
      case 'medium':
        return 'bg-amber-100 text-amber-800 font-bold border border-amber-200';
      case 'low':
        return 'bg-surface-container-low text-secondary-text font-bold border border-surface-container-high/60';
    }
  };

  const getExceptionTypeLabel = (type: GateException['exceptionType']) => {
    switch (type) {
      case 'STUDENT_ABSENT_AT_GATE':
        return 'Student Missing at Gate Bay';
      case 'UNAUTHORIZED_DRIVER_PICKUP':
        return 'Unauthorized Driver / Stranger Attempt';
      case 'VEHICLE_MISMATCH':
        return 'Vehicle Plate Discrepancy';
      case 'GATE_DELAY':
        return 'Gate Congestion / Traffic Delay';
      case 'OTHER':
        return 'Other Gate Discrepancy';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-danger-error text-xl">warning</span>
            <span className="text-xs font-bold uppercase tracking-wider text-danger-error">Gate Discrepancy &amp; Security Desk</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary-text tracking-tight">
            Gate Discrepancy Desk
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Oakridge International School • Real-time incident logging, driver plate mismatches, and instant Central Ops dispatch escalation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-danger-container/50 border border-danger-error/20 px-4 py-2 rounded-full text-danger-error text-xs font-bold font-headline shadow-sm">
          <span className="material-symbols-outlined text-base">emergency</span>
          <span>Central Dispatch: +91 40 8899 0011</span>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-4 bg-[#eff6eb] border border-primary/20 text-primary-text rounded-2xl text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
            <span>{submittedMessage}</span>
          </div>
          <button onClick={() => setSubmittedMessage(null)} className="text-xs font-bold text-primary hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Form (Left Column) */}
        <div className="lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm space-y-5">
          <div className="border-b border-surface-container-high/40 pb-3">
            <h2 className="text-base font-bold font-headline text-primary-text flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">report</span>
              <span>Report Gate Incident</span>
            </h2>
            <p className="text-xs text-secondary-text mt-1">
              Immediately alerts TinyRide Central Dispatch &amp; transport coordinators.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold font-headline text-primary-text uppercase mb-1.5">
                Student Involved
              </label>
              <select
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high/60 rounded-xl text-xs text-primary-text font-medium outline-none focus:border-primary"
              >
                <option value="Aarav Sharma">Aarav Sharma (Grade 3A)</option>
                <option value="Diya Patel">Diya Patel (Grade 4B)</option>
                <option value="Rohan Verma">Rohan Verma (Grade 2C)</option>
                <option value="Ananya Reddy">Ananya Reddy (Grade 5A)</option>
                <option value="Kabir Mehta">Kabir Mehta (Grade 1A)</option>
                <option value="Vivaan Joshi">Vivaan Joshi (Grade 3B)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold font-headline text-primary-text uppercase mb-1.5">
                Discrepancy Type
              </label>
              <select
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high/60 rounded-xl text-xs text-primary-text font-medium outline-none focus:border-primary"
              >
                <option value="STUDENT_ABSENT_AT_GATE">Student Absent at Gate Bay</option>
                <option value="UNAUTHORIZED_DRIVER_PICKUP">Unauthorized Driver Attempt</option>
                <option value="VEHICLE_MISMATCH">Vehicle Registration Mismatch</option>
                <option value="GATE_DELAY">Gate Congestion / Major Delay</option>
                <option value="OTHER">Other Safety Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold font-headline text-primary-text uppercase mb-1.5">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                  <button
                    type="button"
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`py-2 text-[11px] font-bold font-headline rounded-xl border capitalize transition-all ${
                      severity === sev
                        ? 'bg-deep-blue text-white border-deep-blue shadow-xs'
                        : 'bg-surface-container-low text-secondary-text border-surface-container-high/60 hover:bg-surface-container-high'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-headline text-primary-text uppercase mb-1.5">
                Gate Observation Notes
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe observations, plate numbers, or steps taken at the gate..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high/60 rounded-xl text-xs text-primary-text placeholder-secondary-text/60 outline-none focus:border-primary resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-danger-error hover:bg-red-700 text-white font-bold font-headline py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">emergency_share</span>
              <span>Broadcast Safety Incident</span>
            </button>
          </form>
        </div>

        {/* Incidents Feed / Table (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/60 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-headline text-primary-text">Active Gate Exceptions &amp; Audits</h2>
              <p className="text-xs text-secondary-text">Live safety audit records for today's gate operations</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary-text bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container-high/60">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{exceptions.filter((e) => e.status !== 'resolved').length} Unresolved</span>
            </div>
          </div>

          <div className="space-y-3">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className={`bg-surface-container-lowest p-5 rounded-2xl border transition-all shadow-sm ${
                  ex.status === 'resolved'
                    ? 'border-surface-container-high/40 opacity-75'
                    : ex.severity === 'critical' || ex.severity === 'high'
                    ? 'border-danger-error/40 ring-1 ring-danger-error/20'
                    : 'border-surface-container-high/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container-high/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-secondary-text">{ex.id}</span>
                    <span className="font-bold font-headline text-primary-text text-sm">{ex.childName}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(ex.severity)}`}>
                      {ex.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-secondary-text">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    <span>{ex.timestamp}</span>
                  </div>
                </div>

                <div className="py-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-text mb-1">
                    <span className="material-symbols-outlined text-amber-600 text-sm">report_problem</span>
                    <span>{getExceptionTypeLabel(ex.exceptionType)}</span>
                  </div>
                  <p className="text-xs text-primary-text bg-surface-container-low p-3 rounded-xl border border-surface-container-high/40 leading-relaxed">
                    {ex.notes}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-secondary-text">
                  <div className="flex items-center gap-1">
                    <span>Reported by:</span>
                    <strong className="text-primary-text">{ex.reportedBy}</strong>
                  </div>

                  <div>
                    {ex.status === 'resolved' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-primary bg-[#eff6eb] px-3 py-1 rounded-full border border-primary/20 text-[11px]">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolve(ex.id)}
                        className="inline-flex items-center gap-1 font-bold text-white bg-primary hover:bg-primary-container px-3 py-1 rounded-xl shadow-xs transition text-[11px]"
                      >
                        <span className="material-symbols-outlined text-xs">check</span>
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
