'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, RefreshCw, ChevronLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { saveDriverProfile } from '@/lib/driverAuth';

type AuthMode = 'email' | 'phone';
type PhoneStep = 'phone' | 'otp';

export default function DriverLoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone form state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [phoneE164, setPhoneE164] = useState('');

  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Email login submit
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please provide your driver account email and password.');
      return;
    }

    setIsBusy(true);

    try {
      const res = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: 'driver',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify driver credentials.');
      }

      saveDriverProfile({
        name: data.user?.displayName || null,
        phone: '',
        driverId: data.user?.id || '',
        status: 'approved',
      });

      router.replace(data.redirectTo || '/driver');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsBusy(false);
    }
  }

  // Phone send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsBusy(true);
    try {
      const res = await fetch('/api/auth/driver/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch code');
      setPhoneE164(data.phoneE164 || phone.trim());
      setOtpToken(data.otpToken || '');
      setPhoneStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send code. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  // Phone verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setIsBusy(true);
    try {
      const res = await fetch('/api/auth/driver/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phoneE164, token: otp, otpToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      const driverStatus = data.driver?.status || data.status || 'approved';
      saveDriverProfile({
        name: data.driver?.displayName || null,
        phone: phoneE164,
        driverId: data.driverId || data.driver?.driverId || '',
        status: driverStatus,
      });

      if (driverStatus === 'approved') {
        router.replace('/driver');
      } else {
        router.replace(`/driver/onboarding?status=${encodeURIComponent(driverStatus)}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#006B2F] flex flex-col">
      {/* Header bar */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {authMode === 'phone' && phoneStep === 'otp' && (
            <button
              type="button"
              onClick={() => { setPhoneStep('phone'); setOtp(''); setError(''); }}
              className="text-white/70 hover:text-white -ml-1 p-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <p className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">TinyRide</p>
            <h1 className="text-lg font-bold text-white leading-tight">Driver Portal</h1>
          </div>
        </div>

        <Link
          href="/drivers"
          className="text-xs text-white/80 hover:text-white font-medium px-3 py-1.5 rounded-lg bg-white/10 transition-colors"
        >
          Public Page
        </Link>
      </div>

      {/* White card body */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-10 flex flex-col">
        {/* Toggle between Email and Phone */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('email'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email &amp; Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('phone'); setError(''); setPhoneStep('phone'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === 'phone'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mobile SMS
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {authMode === 'email' ? (
          /* Email Login Form */
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Driver Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@example.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-2 min-h-[46px]"
            >
              {isBusy ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Sign In as Driver</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Phone OTP Flow */
          phoneStep === 'phone' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-slate-500 pointer-events-none">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || phone.length < 10}
                className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-2 min-h-[46px]"
              >
                {isBusy ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <span>Request SMS Code</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    6-Digit SMS Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setPhoneStep('phone')}
                    className="text-xs font-bold text-[#006B2F] hover:underline"
                  >
                    Change Phone
                  </button>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-[#006B2F] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy || otp.length !== 6}
                className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-2 min-h-[46px]"
              >
                {isBusy ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <span>Verify &amp; Enter</span>}
              </button>
            </form>
          )
        )}

        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Want to drive for TinyRide?{' '}
            <Link href="/driver/signup" className="font-bold text-[#006B2F] hover:underline">
              Submit Driver Application
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
