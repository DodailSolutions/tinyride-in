'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, CheckCircle2, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';
import {
  getPendingAuth,
  getParentSession,
  saveParentSession,
  DEFAULT_DEMO_CHILD,
  type ParentSession,
} from '@/lib/parentAuth';

export default function ParentVerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [phoneTarget, setPhoneTarget] = useState('+91 98765 43210');
  const [pendingName, setPendingName] = useState('Parent');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');
  const [timer, setTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pending = getPendingAuth();
    if (pending) {
      if (pending.phone) setPhoneTarget(pending.phone);
      if (pending.name) setPendingName(pending.name);
      setAuthMode(pending.mode || 'login');
    }
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (clean.length > 1) {
      // Pasted full code
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        verifyCode(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = clean;
    setDigits(newDigits);

    // Auto-advance
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (newDigits.every((d) => d.length === 1)) {
      verifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = (code: string) => {
    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      // In demo mode or test, any 6-digit code or 123456 is accepted!
      if (code.length !== 6) {
        setError('Please enter a complete 6-digit code.');
        setIsVerifying(false);
        return;
      }

      const existingSession = getParentSession();
      const isExistingUser =
        existingSession &&
        existingSession.user &&
        (existingSession.user.phone === phoneTarget || authMode === 'login');

      if (isExistingUser && existingSession.user.onboardingStatus === 'complete') {
        // Returning parent with complete onboarding -> Go straight to parent dashboard
        router.push('/parent');
      } else {
        // New parent or incomplete onboarding -> initialize session and go to onboarding
        const newSession: ParentSession = {
          token: `tr-parent-${Date.now()}`,
          user: {
            id: `usr-${Date.now()}`,
            name: pendingName !== 'Parent' ? pendingName : existingSession?.user?.name || 'Priya Sharma',
            phone: phoneTarget,
            email: undefined,
            role: 'parent',
            onboardingStatus: 'incomplete',
            createdAt: new Date().toISOString(),
          },
          children: existingSession?.children?.length ? existingSession.children : [DEFAULT_DEMO_CHILD],
          activeChildId: existingSession?.activeChildId || DEFAULT_DEMO_CHILD.id,
        };

        saveParentSession(newSession);

        if (authMode === 'login' && existingSession?.user?.onboardingStatus === 'complete') {
          router.push('/parent');
        } else {
          router.push('/parent/onboarding');
        }
      }
    }, 600);
  };

  const handleQuickFill = () => {
    const demo = ['1', '2', '3', '4', '5', '6'];
    setDigits(demo);
    verifyCode('123456');
  };

  const handleResend = () => {
    if (timer > 0) return;
    setIsResending(true);
    setTimeout(() => {
      setTimer(30);
      setIsResending(false);
      setError('');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href={authMode === 'signup' ? '/parent/signup' : '/parent/login'}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
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

          <div className="text-sm text-slate-500 hidden sm:block">Verification</div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80">
            {/* Header / Title */}
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Verify Your Number
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Enter the 6-digit security code sent to{' '}
                <span className="font-semibold text-slate-900">{phoneTarget}</span>
              </p>
            </div>

            {/* Quick Demo Pre-fill Pill */}
            <div className="mb-6 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="text-xs text-emerald-900">
                <span className="font-semibold">Demo Code:</span> Use <strong>123456</strong>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-emerald-200/90 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
              >
                Quick-fill (123456)
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="flex justify-between gap-2 sm:gap-3 mb-6">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] transition-all"
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => verifyCode(digits.join(''))}
              disabled={isVerifying || digits.some((d) => !d)}
              className="w-full py-3.5 px-4 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify and Continue</span>
                </>
              )}
            </button>

            {/* Resend Timer */}
            <div className="mt-5 flex items-center justify-center text-xs text-slate-500">
              {timer > 0 ? (
                <span>Resend code in <strong className="text-slate-800">{timer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-semibold text-[#006B2F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>Resend 6-Digit Code</span>
                </button>
              )}
            </div>

            {/* Reassurance */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Two-factor validation ensures only authorized guardians can access live ride telemetry.</span>
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
