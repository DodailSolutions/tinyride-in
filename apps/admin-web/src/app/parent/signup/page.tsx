'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Phone, User, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { setPendingAuth } from '@/lib/parentAuth';

export default function ParentSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPhone = phone.trim().replace(/\s+/g, '');
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);

    const formattedPhone = trimmedPhone.startsWith('+91')
      ? trimmedPhone
      : `+91 ${trimmedPhone.replace(/^0+/, '')}`;

    setPendingAuth({
      name: fullName.trim(),
      phone: formattedPhone,
      email: email.trim() || undefined,
      mode: 'signup',
    });

    setTimeout(() => {
      router.push('/parent/verify');
    }, 400);
  };

  const handleDemoFill = () => {
    setFullName('Priya Sharma');
    setPhone('98765 43210');
    setEmail('priya.sharma@example.com');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/parents"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to For Parents</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#006B2F] to-[#005224] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.8 2 11 2 11.2V16c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Tiny<span className="text-[#006B2F]">Ride</span>
            </span>
          </Link>

          <div className="text-sm text-slate-500 hidden sm:block">Parent Portal</div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80">
            {/* Header / Title */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-3 border border-emerald-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parent Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Get Started with TinyRide
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Connect with your child&apos;s school vehicle for real-time tracking, boarding confirmation, and peace of mind.
              </p>
            </div>

            {/* Quick Demo Pre-fill Pill */}
            <div className="mb-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-900">
                <span className="font-semibold">Quick Demo?</span> Pre-fill sample parent details:
              </div>
              <button
                type="button"
                onClick={handleDemoFill}
                className="px-2.5 py-1 text-xs font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap active:scale-95"
              >
                Auto-fill
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent / Guardian Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] transition-all"
                  />
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  We will send a 6-digit one-time verification code to this number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[11px] font-normal text-slate-400 normal-case">Optional</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] transition-all"
                  />
                </div>
              </div>

              {/* Consent checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#006B2F] focus:ring-[#006B2F] border-slate-300"
                  />
                  <span className="text-xs text-slate-600 leading-normal">
                    I agree to receive school ride alerts, arrival notifications, and OTP verification via SMS / WhatsApp.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !agreed}
                className="w-full py-3.5 px-4 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue with Phone Number</span>
                    <span className="text-emerald-200 font-light">&rarr;</span>
                  </>
                )}
              </button>
            </form>

            {/* Reassurance badge */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                TinyRide connects directly with your school to keep school rides verified and secure.
              </span>
            </div>

            {/* Existing user link */}
            <div className="mt-5 text-center text-xs text-slate-600">
              Already have a parent account?{' '}
              <Link
                href="/parent/login"
                className="font-semibold text-[#006B2F] hover:underline"
              >
                Log in here
              </Link>
            </div>
          </div>

          {/* Micro trust features */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs text-slate-500">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant OTP Access</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero App Download Needed</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.
      </footer>
    </div>
  );
}
