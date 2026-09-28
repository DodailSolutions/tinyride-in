'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import {
  getPendingAuth,
  setPendingAuth,
  saveParentSession,
} from '@/lib/parentAuth';

export default function ParentVerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [phoneTarget, setPhoneTarget] = useState('+91 98765 43210');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [timer, setTimer] = useState(24);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pending = getPendingAuth();
    if (pending && pending.phone) {
      setPhoneTarget(pending.phone);
      setAuthMode(pending.mode || 'signup');
    }
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setError('');

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      verifyCode(pasted);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');

    // Full 6 digits autofilled by browser/SMS
    if (clean.length === 6) {
      const fullDigits = clean.split('');
      setDigits(fullDigits);
      setError('');
      verifyCode(clean);
      return;
    }

    // Take the last typed digit if input already had a value
    const singleChar = clean ? clean.slice(-1) : '';
    const newDigits = [...digits];
    newDigits[index] = singleChar;
    setDigits(newDigits);
    if (error) setError('');

    // Advance to next input
    if (singleChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are complete
    if (newDigits.every((d) => d.length === 1)) {
      verifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const pending = getPendingAuth();
      const cleanDigits = phoneTarget.replace(/\D/g, '');
      const e164 = `+91${cleanDigits.slice(-10)}`;
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: e164,
          token: code,
          otpToken: pending?.otpToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid verification code. Please try again.');
        setIsVerifying(false);
        return;
      }

      // Save real session in parentAuth
      saveParentSession({
        token: data.sessionToken || data.token,
        user: data.user,
        children: data.children || [],
        activeChildId: data.children?.[0]?.id || '',
      });

      if (data.user?.onboardingStatus === 'complete' && data.children && data.children.length > 0) {
        router.push('/parent');
      } else {
        router.push('/parent/onboarding');
      }
    } catch {
      setError('Network connection error. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleUseDemoOtp = () => {
    const demoCode = ['4', '8', '2', '9', '1', '0'];
    setDigits(demoCode);
    setError('');
    verifyCode('482910');
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setIsResending(true);
    setError('');
    try {
      const cleanDigits = phoneTarget.replace(/\D/g, '');
      const e164 = `+91${cleanDigits.slice(-10)}`;
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code');
      } else {
        if (data.otpToken) {
          const current = getPendingAuth();
          setPendingAuth({
            ...current,
            phone: phoneTarget,
            mode: authMode,
            otpToken: data.otpToken,
          });
        }
        setTimer(30);
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
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
            href={authMode === 'login' ? '/parent/login' : '/parent/signup'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Change number</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN OTP FORM */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[460px]">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/40 border border-slate-200/80">
            {/* Header Titles */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Verify your mobile number
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We sent a 6-digit code to{' '}
                <strong className="text-slate-900 font-semibold">{phoneTarget}</strong>
              </p>
            </div>

            {/* Error state */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 6 Digit OTP Inputs */}
            <div className="space-y-3 mb-6">
              <div onPaste={handlePaste} className="flex justify-between gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1} of verification code`}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] transition-all select-none"
                  />
                ))}
              </div>

              {/* Demo Helper Button */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Demo code: 123456</span>
                <button
                  type="button"
                  onClick={handleUseDemoOtp}
                  className="font-semibold text-xs text-[#006B2F] hover:underline cursor-pointer select-none"
                >
                  Auto-fill demo code
                </button>
              </div>
            </div>

            {/* Primary Verify CTA */}
            <button
              type="button"
              onClick={() => verifyCode(digits.join(''))}
              disabled={isVerifying || digits.some((d) => !d)}
              className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>Verify</span>
              )}
            </button>

            {/* Resend & Change Number Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <Link
                href={authMode === 'login' ? '/parent/login' : '/parent/signup'}
                className="font-semibold text-slate-600 hover:text-slate-900 hover:underline min-h-[44px] flex items-center"
              >
                Change number
              </Link>

              <div>
                {timer > 0 ? (
                  <span>
                    Resend code in <strong className="text-slate-800">{timer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-bold text-[#006B2F] hover:underline min-h-[44px] flex items-center cursor-pointer disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>
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
