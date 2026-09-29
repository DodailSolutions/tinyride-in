'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Lock, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveParentSession } from '@/lib/parentAuth';

export default function ParentSignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Please provide your name, email address, and a secure password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/email/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() ? `+91${phone.replace(/\D/g, '').slice(-10)}` : undefined,
          role: 'parent',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create parent account.');
        setIsSubmitting(false);
        return;
      }

      if (data.needsVerification) {
        setVerificationRequired(true);
        setVerificationMessage(data.message || 'Please check your email to verify your account.');
        setIsSubmitting(false);
        return;
      }

      // Auto-authenticated session
      if (data.user) {
        saveParentSession({
          token: 'authenticated',
          user: {
            id: data.user.id,
            name: data.user.displayName || displayName.trim(),
            phone: phone || '',
            email: data.user.email,
            role: 'parent',
            onboardingStatus: 'incomplete',
            createdAt: new Date().toISOString(),
          },
          children: [],
          activeChildId: '',
        });
      }

      router.push(data.redirectTo || '/parent/onboarding');
      router.refresh();
    } catch {
      setError('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* 1. HEADER */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — School transportation and live ride tracking"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

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

      {/* 2. MAIN SIGNUP FORM */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[460px]">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/40 border border-slate-200/80">
            {verificationRequired ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">Check your email</h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {verificationMessage}
                </p>
                <div className="pt-4">
                  <Link
                    href="/parent/login"
                    className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-[#006B2F] text-white text-sm font-bold shadow-md hover:bg-[#005525] transition-colors"
                  >
                    Proceed to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Create parent account
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Set up your secure profile to register your child and monitor school commutes.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 leading-normal flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                      <input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="parent@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-phone"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                    >
                      Mobile Number <span className="text-slate-400 font-normal lowercase">(for SMS ride alerts)</span>
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                      <input
                        id="signup-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                      <input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 min-h-[46px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
                  Already have an account?{' '}
                  <Link
                    href="/parent/login"
                    className="font-bold text-[#006B2F] hover:underline min-h-[44px] inline-flex items-center"
                  >
                    Sign in here
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 3. LEGAL FOOTER */}
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
