'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveParentSession, getParentSession } from '@/lib/parentAuth';

export default function ParentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    const session = getParentSession();
    if (session?.user && session?.token && session.user.role === 'parent') {
      // User already has an active session
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: 'parent',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to sign in. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Save client-side profile
      if (data.user) {
        saveParentSession({
          token: 'authenticated',
          user: {
            id: data.user.id,
            name: data.user.displayName || email.split('@')[0],
            phone: '',
            email: data.user.email,
            role: 'parent',
            onboardingStatus: data.user.onboardingStatus || 'complete',
            createdAt: new Date().toISOString(),
          },
          children: [],
          activeChildId: '',
        });
      }

      router.push(data.redirectTo || '/parent');
      router.refresh();
    } catch {
      setError('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/email/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setSuccessMessage(data.message || 'If an account exists with this email, you will receive password reset instructions.');
      setIsSubmitting(false);
    } catch {
      setError('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* 1. DEDICATED MINIMAL APPLICATION HEADER */}
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

      {/* 2. MAIN FORM CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[460px]">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/40 border border-slate-200/80">
            {/* Header Titles */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {isForgotPassword ? 'Reset your password' : 'Parent Portal'}
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {isForgotPassword
                  ? 'Enter your registered email address to receive password recovery instructions.'
                  : 'Sign in with your verified email and password to track school rides.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 leading-normal flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 leading-normal flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {isForgotPassword ? (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                  >
                    Account Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      required
                      placeholder="parent@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[46px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 min-h-[46px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs font-semibold text-[#006B2F] hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              /* Email + Password Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      required
                      placeholder="parent@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[46px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] font-semibold text-[#006B2F] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 select-none pointer-events-none" />
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[46px]"
                    />
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 min-h-[46px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            )}

            {/* Signup prompt */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
              New to TinyRide?{' '}
              <Link
                href="/parent/signup"
                className="font-bold text-[#006B2F] hover:underline min-h-[44px] inline-flex items-center"
              >
                Create your parent account
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
