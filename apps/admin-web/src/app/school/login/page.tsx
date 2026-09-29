'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, Lock, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { saveSchoolProfile } from '@/lib/schoolAuth';

export default function SchoolLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setError('Please provide your school administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: 'school',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      if (data.user) {
        saveSchoolProfile({
          userId: data.user.id,
          schoolId: '',
          schoolName: 'School Transport Operations',
          adminName: data.user.displayName || email.split('@')[0],
          phone: '',
          staffRole: 'admin',
          verificationStatus: 'verified',
        });
      }

      router.push(data.redirectTo || '/school');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid school administrator email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/email/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setSuccessMessage(data.message || 'If a registered account exists, you will receive password reset instructions.');
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between font-sans selection:bg-[#006B2F] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/schools" className="flex items-center gap-2 group">
          <img
            src="/brand/logo-horizontal.png"
            alt="TinyRide"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <Link
          href="/schools"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Schools</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3 border border-emerald-200/80">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isForgotPassword ? 'Reset Password' : 'School Transport Login'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isForgotPassword
                ? 'Enter your institutional email address to recover your password.'
                : 'Sign in to access your school transport operations console.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="transport@school.edu.in"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[46px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Send Recovery Instructions</span>}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-[#006B2F] hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="transport@school.edu.in"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-bold text-[#006B2F] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[46px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Enter School Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Not registered as a partner school yet?{' '}
              <Link href="/school/signup" className="font-bold text-[#006B2F] hover:underline">
                Register Your School
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
        © {new Date().getFullYear()} TinyRide • Dedicated School Transportation Portal
      </footer>
    </div>
  );
}
