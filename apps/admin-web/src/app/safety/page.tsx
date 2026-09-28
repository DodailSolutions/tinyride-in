import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, KeyRound, MapPin, UserCheck, Bus } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust & Safety | TinyRide',
  description: 'Understand TinyRide’s multi-layered safety architecture for school commutes: SafeKey boarding verification, GPS telemetry corridors, automated parent alerts, and school gate coordination.',
};

export default function TrustAndSafetyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — School transportation and live ride tracking"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-white border-b border-slate-200/80 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200/80 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Safety Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Trust &amp; Safety at TinyRide
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            School transportation requires unwavering reliability. TinyRide is engineered with multi-layered digital checks that keep parents, schools, and drivers coordinated on every single trip.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            <span><strong>Updated:</strong> September 28, 2026</span>
            <span>•</span>
            <span>Dodail Solutions Private Limited</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 text-sm leading-relaxed text-slate-700">
        {/* Core Principles Grid */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Our Core Safety Principles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5 text-[#006B2F]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">SafeKey Boarding Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every enrolled student has a unique SafeKey digital token. At the pickup stop, boarding is confirmed electronically, instantly sending a push alert to the parent&apos;s lock screen.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5 text-[#006B2F]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Approved School Corridors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vehicles travel along pre-mapped school routes. Real-time GPS telemetry tracks progress and traffic variations, keeping arrival times accurate without requiring in-cab calls.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5 text-[#006B2F]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Driver &amp; Vehicle Visibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parents always know who is driving. The parent application displays the assigned driver’s name, contact information, vehicle model, and registration plate.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Bus className="w-5 h-5 text-[#006B2F]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Campus Gate Drop-off Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Schools receive advance arrival timing to stagger bus bay entries, eliminate gate congestion, and verify student arrivals directly on the school administration dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Distraction-Free Driver Interface */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Distraction-Free Driver Experience
          </h2>
          <p>
            Driver distraction is a major risk factor during school commutes. TinyRide addresses this through deliberate product constraints:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
            <li><strong>Automated Proximity Alerts:</strong> Parents receive automated 500-meter approach notifications automatically, removing the need for drivers to dial parents or answer incoming calls.</li>
            <li><strong>Sequential Touch-Optimized Stops:</strong> The driver tablet/mobile interface presents only the immediate next pickup or drop-off location with oversized high-contrast buttons.</li>
            <li><strong>One-Tap Absence Sync:</strong> When parents mark a child absent, the driver&apos;s manifest updates instantly, eliminating unnecessary curb idling.</li>
          </ul>
        </section>

        {/* Operational Oversight */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Operational Oversight &amp; Audit Trail
          </h2>
          <p>
            Every ride produces a complete operational log: departure time from the depot, stop arrival times, SafeKey boarding events, and school gate arrival timestamps. Both parents and school administrative staff have complete transparency over transit timings.
          </p>
        </section>

        {/* Quick Links */}
        <section className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-slate-900">
            Have Questions About Transport Safety?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Contact our safety and school coordination team or review our operational documentation:
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-emerald-800 pt-1">
            <Link href="/parents" className="hover:underline">For Parents →</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy →</Link>
            <Link href="/terms" className="hover:underline">Terms of Service →</Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-slate-600 font-medium">
          <Link href="/terms" className="hover:text-emerald-800 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-emerald-800 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/safety" className="text-emerald-800 font-bold">Trust &amp; Safety</Link>
        </div>
      </footer>
    </div>
  );
}
