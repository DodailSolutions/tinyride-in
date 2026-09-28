'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, RefreshCw, ChevronLeft, ShieldCheck } from 'lucide-react';
import { saveDriverProfile } from '@/lib/driverAuth';

type Step = 'phone' | 'otp' | 'loading';

export default function DriverLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

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
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setPhoneE164(data.phoneE164 || phone.trim());
      setOtpToken(data.otpToken || '');
      if (data.debugCode) setDebugCode(data.debugCode);
      setResendCooldown(30);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send code. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

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

        // Save minimal public profile for UI
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
          // Send to onboarding / status review page
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
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        {step === 'otp' && (
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="text-white/70 hover:text-white -ml-1 p-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <p className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">TinyRide</p>
          <h1 className="text-lg font-bold text-white leading-tight">Driver App</h1>
        </div>
      </div>

      {/* White card body */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10 flex flex-col">
        
        {step === 'phone' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-sm text-slate-500">Enter your registered mobile number to continue.</p>
            </div>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  Mobile Number
                </label>
                <div className="flex items-center border-2 border-slate-200 rounded-2xl overflow-hidden focus-within:border-[#006B2F] transition-colors">
                  <span className="pl-4 pr-2 text-slate-500 text-sm font-medium select-none">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="flex-1 py-4 pr-4 text-lg font-medium text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                    autoComplete="tel-national"
                    autoFocus
                  />
                  <Phone className="w-4 h-4 text-slate-300 mr-4" />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 font-medium px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={isBusy || phone.length < 10}
                className="w-full py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
              >
                {isBusy ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Get Verification Code</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-8 leading-relaxed">
              Only registered TinyRide drivers can log in.<br />
              Contact your operator if you can&apos;t access your account.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Enter code</h2>
              <p className="text-sm text-slate-500">
                A 6-digit code was sent to{' '}
                <span className="font-semibold text-slate-700">{phoneE164}</span>
              </p>
              {debugCode && (
                <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Dev mode code</p>
                  <p className="text-2xl font-bold text-amber-800 tracking-[0.25em]">{debugCode}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  Verification Code
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 text-center text-3xl font-bold text-slate-900 tracking-[0.4em] bg-transparent outline-none focus:border-[#006B2F] transition-colors placeholder:text-slate-200 placeholder:text-2xl"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 font-medium px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={isBusy || otp.length !== 6}
                className="w-full py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isBusy ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify &amp; Log In</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={resendCooldown > 0 || isBusy}
                className="text-sm text-[#006B2F] font-semibold py-2 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
