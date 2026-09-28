'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, User, MapPin, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { saveSchoolProfile } from '@/lib/schoolAuth';

export default function SchoolSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [address, setAddress] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/school/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          adminName,
          phone,
          city,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      setOtpToken(data.otpToken || '');
      if (data.debugCode) setDebugCode(data.debugCode);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/school/register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          adminName,
          phone,
          city,
          address,
          code: otp,
          otpToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.school && data.user) {
        saveSchoolProfile({
          userId: data.user.id,
          schoolId: data.school.id,
          schoolName: data.school.name,
          adminName: data.user.name,
          phone: data.user.phone,
          staffRole: data.user.staffRole,
          verificationStatus: data.school.verificationStatus,
        });
      }

      router.push('/school/onboarding?status=pending');
    } catch (err: any) {
      setError(err?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between font-sans selection:bg-[#006B2F] selection:text-white">
      {/* Header */}
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3 border border-emerald-200/80">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Your School
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {step === 'details'
                ? 'Join TinyRide to manage routes, track active trips, and verify student boarding'
                : `Enter the 6-digit verification code sent to ${phone}`}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  School / Institution Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Olive Mount International School"
                    required
                    className="w-full pl-4 pr-10 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transport Coordinator / Administrator Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Ramesh Varma"
                    required
                    className="w-full pl-4 pr-10 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                      maxLength={10}
                      placeholder="98765 43210"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  >
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Secunderabad">Secunderabad</option>
                    <option value="Warangal">Warangal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Campus Address / Landmark
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Near Cyber Towers, Hitec City"
                    className="w-full pl-4 pr-10 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !schoolName || !adminName || phone.length < 10}
                className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[46px] mt-2"
              >
                <span>{loading ? 'Sending Code...' : 'Verify Phone & Register School'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmRegistration} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-[11px] font-bold text-[#006B2F] hover:underline"
                  >
                    Edit Details
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                    maxLength={6}
                    placeholder="••••••"
                    autoFocus
                    required
                    className="w-full px-4 py-3 bg-[#FAFAF9] border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {debugCode && (
                  <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Test verification code: <strong>{debugCode}</strong> (or 482910)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[46px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Completing Registration...' : 'Confirm & Complete Registration'}</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an active school account?{' '}
              <Link href="/school/login" className="font-bold text-[#006B2F] hover:underline">
                School Login
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
        © {new Date().getFullYear()} TinyRide • School Partner Onboarding Portal
      </footer>
    </div>
  );
}
