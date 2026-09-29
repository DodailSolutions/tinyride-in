'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { saveSchoolProfile } from '@/lib/schoolAuth';

export default function SchoolSignupPage() {
  const router = useRouter();

  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!schoolName.trim() || !adminName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/email/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: adminName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'school',
          phone: phone.trim() ? `+91${phone.replace(/\D/g, '').slice(-10)}` : undefined,
          metadata: {
            schoolName: schoolName.trim(),
            city,
            address: address.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.needsVerification) {
        setVerificationRequired(true);
        setVerificationMessage(data.message || 'Please check your email to verify your institutional account.');
        setLoading(false);
        return;
      }

      if (data.user) {
        saveSchoolProfile({
          userId: data.user.id,
          schoolId: '',
          schoolName: schoolName.trim(),
          adminName: adminName.trim(),
          phone: phone || '',
          staffRole: 'admin',
          verificationStatus: 'pending',
        });
      }

      router.push('/school/onboarding?status=pending');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register school');
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
          {verificationRequired ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Check institutional email</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {verificationMessage}
              </p>
              <div className="pt-4">
                <Link
                  href="/school/login"
                  className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-[#006B2F] text-white text-sm font-bold shadow-md hover:bg-[#005525] transition-colors"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3 border border-emerald-200/80">
                  <Building2 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Register Your School
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Join TinyRide to manage routes, track active trips, and ensure student commute safety.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    School / Institution Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Oakridge International School"
                      required
                      className="w-full px-4 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Coordinator Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Transport Head"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                        maxLength={10}
                        placeholder="98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="transport@school.edu.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Hyderabad"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Campus Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Gachibowli, Hyderabad"
                      className="w-full px-3 py-2.5 bg-[#FAFAF9] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B2F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[46px] mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Complete Registration</span>}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Already registered?{' '}
                  <Link href="/school/login" className="font-bold text-[#006B2F] hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
        © {new Date().getFullYear()} TinyRide • Dedicated School Transportation Portal
      </footer>
    </div>
  );
}
