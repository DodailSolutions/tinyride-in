'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { getSchoolProfile, clearSchoolProfile } from '@/lib/schoolAuth';

function SchoolOnboardingContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const statusParam = searchParams.get('status');

  useEffect(() => {
    const prof = getSchoolProfile();
    setProfile(prof);
  }, []);

  const currentStatus = statusParam || profile?.verificationStatus || 'pending';

  const handleLogout = () => {
    clearSchoolProfile();
    window.location.href = '/school/login';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between font-sans selection:bg-[#006B2F] selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/brand/logo-horizontal.png"
            alt="TinyRide"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          {currentStatus === 'verified' ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                School Account Verified!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Your school transport profile is fully approved. You can now access your live operations dashboard.
              </p>
              <div className="mt-6">
                <Link
                  href="/school"
                  className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[46px]"
                >
                  <span>Enter School Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : currentStatus === 'rejected' ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Application Needs Review
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                We could not verify the provided school registration details. Please reach out to our school partner desk.
              </p>
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Partner Support
                </h4>
                <p className="text-xs text-slate-600">
                  Email: <strong>schools@tinyride.in</strong>
                  <br />
                  Support Desk: <strong>+91 40 6828 0000</strong>
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Default: Pending Verification */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Clock className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Verification Pending
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {profile?.schoolName || 'School Profile Received'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  Our operations team is reviewing your school profile and setting up your dedicated route corridors.
                </p>
              </div>

              {/* Verification Checkpoints */}
              <div className="space-y-3 bg-[#FAFAF9] border border-slate-200 rounded-2xl p-4 mb-6">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Verification Checklist
                </h4>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mobile OTP &amp; administrator profile verified</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <span>School identity &amp; address review in progress</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  <span>Route corridor configuration &amp; driver assignment</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  <span>Portal activation &amp; parent onboarding release</span>
                </div>
              </div>

              {/* Support Notice */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-[#006B2F] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Need priority onboarding?</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Our school operations coordinators can help expedite route setup: <strong>schools@tinyride.in</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
        © {new Date().getFullYear()} TinyRide • School Partner Verification Desk
      </footer>
    </div>
  );
}

export default function SchoolOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center text-xs text-slate-500">Loading school onboarding...</div>}>
      <SchoolOnboardingContent />
    </Suspense>
  );
}
