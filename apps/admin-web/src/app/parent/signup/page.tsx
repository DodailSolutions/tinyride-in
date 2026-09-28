'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { setPendingAuth } from '@/lib/parentAuth';

export default function ParentSignupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean raw digits
  const rawDigits = phone.replace(/\D/g, '');
  const isValid = rawDigits.length === 10;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('91') && val.length > 10) val = val.slice(2);
    if (val.startsWith('0') && val.length > 10) val = val.slice(1);
    val = val.slice(0, 10);
    setPhone(val);
    if (error) setError('');
  };

  const handleUseDemoPhone = () => {
    setPhone('9876543210');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawDigits) {
      setError('Please enter your mobile number.');
      return;
    }
    if (!isValid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;

    setPendingAuth({
      phone: formattedPhone,
      mode: 'signup',
    });

    setTimeout(() => {
      router.push('/parent/verify');
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* 1. DEDICATED MINIMAL APPLICATION HEADER */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Approved Official TinyRide Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — School transportation and live ride tracking"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Simple Back Action */}
          <Link
            href="/parents"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Parents</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* 2. REGISTRATION CARD / CONTENT */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[460px]">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/40 border border-slate-200/80">
            {/* Header Titles */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Create your parent account
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Stay connected to your child&apos;s school ride.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 leading-normal"
              >
                {error}
              </div>
            )}

            {/* Phone-First Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="mobile-number"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                >
                  Mobile number
                </label>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-slate-600 select-none pointer-events-none">
                    +91
                  </span>
                  <input
                    id="mobile-number"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    autoFocus
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`w-full pl-14 pr-4 py-3.5 rounded-xl bg-slate-50 border text-base text-slate-900 font-medium placeholder:text-slate-400 placeholder:text-sm focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                      error
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-slate-200 focus:ring-[#006B2F]/20 focus:border-[#006B2F]'
                    }`}
                    aria-describedby="phone-helper"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <p id="phone-helper" className="text-slate-500">
                    We&apos;ll send you a 6-digit verification code.
                  </p>
                  <button
                    type="button"
                    onClick={handleUseDemoPhone}
                    className="text-[11px] font-semibold text-[#006B2F] hover:underline cursor-pointer select-none"
                  >
                    Use demo number
                  </button>
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>

            {/* Privacy Agreement Text */}
            <p className="mt-5 text-[11.5px] text-center text-slate-500 leading-relaxed">
              By continuing, you agree to TinyRide&apos;s{' '}
              <Link href="/terms" className="underline text-slate-700 hover:text-slate-900">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline text-slate-700 hover:text-slate-900">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Returning Parent Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                href="/parent/login"
                className="font-bold text-[#006B2F] hover:underline min-h-[44px] inline-flex items-center"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 3. MINIMAL LEGAL FOOTER */}
      <footer className="py-5 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
        <Link href="/privacy" className="hover:text-slate-600 transition-colors">
          Privacy
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-slate-600 transition-colors">
          Terms
        </Link>
        <span>•</span>
        <span>&copy; {new Date().getFullYear()} TinyRide</span>
      </footer>
    </div>
  );
}
