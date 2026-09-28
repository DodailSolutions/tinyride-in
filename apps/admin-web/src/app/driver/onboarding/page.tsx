'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  ShieldAlert,
  XCircle,
  Phone,
  Truck,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { logoutDriver } from '@/lib/driverAuth';

function DriverOnboardingStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'pending_verification';

  const isPending = status === 'pending_verification' || status === 'pending' || status === 'needs_resubmission';
  const isRejected = status === 'rejected';
  const isSuspended = status === 'suspended';

  return (
    <div className="min-h-dvh bg-slate-950 text-white flex flex-col font-sans pb-12 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/brand/logo-stacked.png"
            alt="TinyRide"
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">TinyRide Driver</h1>
            <p className="text-sm font-bold text-white tracking-tight mt-0.5">Verification &amp; Onboarding</p>
          </div>
        </div>

        <button
          onClick={async () => {
            await logoutDriver();
            window.location.href = '/driver/login';
          }}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-400 active:scale-95 transition-all"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-6 max-w-lg mx-auto w-full flex flex-col gap-5">
        {/* Status Hero Card */}
        {isPending && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Application Under Review
            </span>
            <h2 className="text-xl font-extrabold text-white">Your driver account is being verified</h2>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Our safety and fleet operations team reviews your commercial driver license, vehicle registration, and background details before route assignments begin.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-1">
              <XCircle className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Application Not Approved
            </span>
            <h2 className="text-xl font-extrabold text-white">Verification was unsuccessful</h2>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              We were unable to approve your application based on the submitted driver documentation. Please contact fleet operations if you believe this is an error.
            </p>
          </div>
        )}

        {isSuspended && (
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-1">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Account Suspended
            </span>
            <h2 className="text-xl font-extrabold text-white">Account temporarily on hold</h2>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Your driver account has been suspended by school transportation operations. Contact support immediately for assistance.
            </p>
          </div>
        )}

        {/* Verification Checklist */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Verification Checklist
          </h3>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Mobile Verification</p>
                  <p className="text-[11px] text-slate-400">Phone verified via secure OTP</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">
                Complete
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Driver License Check</p>
                  <p className="text-[11px] text-slate-400">Commercial badge &amp; validity check</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/40">
                In Review
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Vehicle Details</p>
                  <p className="text-[11px] text-slate-400">Registration &amp; capacity review</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/40">
                In Review
              </span>
            </div>
          </div>
        </section>

        {/* Support Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Need Help or Have Questions?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            School transportation onboarding typically completes within 24 to 48 business hours. For immediate assistance with verification:
          </p>

          <a
            href="tel:+914067890000"
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Call Driver Support: +91 40 6789 0000</span>
          </a>
        </section>

        <Link
          href="/drivers"
          className="text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 py-2 transition-colors"
        >
          Return to Driver Overview
        </Link>
      </main>
    </div>
  );
}

export default function DriverOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm font-medium text-slate-400">Loading driver onboarding status...</p>
      </div>
    }>
      <DriverOnboardingStatusContent />
    </Suspense>
  );
}
