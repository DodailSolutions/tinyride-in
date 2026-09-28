'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newDigits = [...digits];

    if (clean.length > 1) {
      // Pasted complete code
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
    if (error) setError('');

    // Auto-advance
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
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
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      // Any 6-digit numeric input is accepted in demo/evaluation mode
      const existingSession = getParentSession();
      const isExistingUser =
        existingSession &&
        existingSession.user &&
        (existingSession.user.phone === phoneTarget || authMode === 'login');

      if (isExistingUser && existingSession.user.onboardingStatus === 'complete') {
        // Returning parent with completed onboarding -> Straight to Parent App
        router.push('/parent');
      } else {
        // New parent or incomplete onboarding -> create session & move to onboarding
        const newSession: ParentSession = {
          token: `tr-parent-${Date.now()}`,
          user: {
            id: `usr-${Date.now()}`,
            name: existingSession?.user?.name || '',
            phone: phoneTarget,
            role: 'parent',
            onboardingStatus: 'incomplete',
            createdAt: new Date().toISOString(),
          },
          children: existingSession?.children?.length ? existingSession.children : [DEFAULT_DEMO_CHILD],
          activeChildId: existingSession?.activeChildId || DEFAULT_DEMO_CHILD.id,
        };

        saveParentSession(newSession);
        router.push('/parent/onboarding');
      }
    }, 450);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setIsResending(true);
    setError('');
    setTimeout(() => {
      setTimer(24);
      setIsResending(false);
    }, 400);
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
            <div className="flex justify-between gap-2 sm:gap-2.5 mb-6">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1} of verification code`}
                  className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] transition-all"
                />
              ))}
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
