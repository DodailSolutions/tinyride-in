'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ShieldCheck,
  Truck,
  User,
  FileText,
  MapPin,
} from 'lucide-react';
import { saveDriverProfile } from '@/lib/driverAuth';

type Step = 'details' | 'otp';

export default function DriverSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [vehicleType, setVehicleType] = useState('auto');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [capacity, setCapacity] = useState('4');

  // OTP State
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const rawPhone = phone.replace(/\D/g, '');
  const isFormValid =
    fullName.trim().length >= 2 &&
    rawPhone.length === 10 &&
    licenseNumber.trim().length >= 5 &&
    registrationNumber.trim().length >= 5;

  // Step 1: Submit details & send OTP
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError('Please fill in all required driver and vehicle fields correctly.');
      return;
    }

    setIsBusy(true);

    try {
      const res = await fetch('/api/auth/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${rawPhone}`,
          fullName: fullName.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          city,
          vehicleType,
          registrationNumber: registrationNumber.trim().toUpperCase(),
          makeModel: makeModel.trim(),
          capacity: Number(capacity) || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyRegistered) {
          router.push('/driver/login');
          return;
        }
        throw new Error(data.error || 'Failed to initiate registration');
      }

      setPhoneE164(data.phoneE164 || `+91${rawPhone}`);
      setOtpToken(data.otpToken || '');
      if (data.debugCode) setDebugCode(data.debugCode);
      setResendCooldown(30);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending code. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  // Step 2: Confirm OTP & complete registration
  const handleConfirmSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setIsBusy(true);

    try {
      const res = await fetch('/api/auth/driver/register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneE164,
          token: otp,
          otpToken,
          fullName: fullName.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          city,
          vehicleType,
          registrationNumber: registrationNumber.trim().toUpperCase(),
          makeModel: makeModel.trim(),
          capacity: Number(capacity) || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Save public profile
      saveDriverProfile({
        name: fullName.trim(),
        phone: phoneE164,
        driverId: data.driver?.driverId || '',
        status: 'pending_verification',
      });

      // Redirect to onboarding review screen
      router.replace('/driver/onboarding?status=pending_verification');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#006B2F] flex flex-col font-sans">
      {/* Top Header */}
      <div className="px-5 pt-10 pb-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          {step === 'otp' ? (
            <button
              type="button"
              onClick={() => { setStep('details'); setOtp(''); setError(''); }}
              className="text-white/80 hover:text-white p-1 -ml-1"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <Link href="/drivers" className="text-white/80 hover:text-white p-1 -ml-1">
              <ChevronLeft className="w-6 h-6" />
            </Link>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Driver Enrollment</p>
            <h1 className="text-lg font-black leading-tight">Join TinyRide Fleet</h1>
          </div>
        </div>

        <Link
          href="/driver/login"
          className="text-xs font-bold text-white/90 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl transition-all"
        >
          Log In
        </Link>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-12 flex flex-col">
        {step === 'details' && (
          <form onSubmit={handleInitiateSignup} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Driver Registration</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register your vehicle to operate school routes in your area.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name (as per DL) *
              </label>
              <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-3 focus-within:border-[#006B2F] transition-colors">
                <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number (for OTP) *
              </label>
              <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-3 focus-within:border-[#006B2F] transition-colors">
                <span className="text-xs font-bold text-slate-500 mr-2 select-none">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent"
                />
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Driver License Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Commercial Driver License (DL) *
              </label>
              <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-3 focus-within:border-[#006B2F] transition-colors">
                <FileText className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TS09 20180012345"
                  className="w-full text-sm font-semibold text-slate-900 outline-none uppercase bg-transparent"
                />
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'auto', label: 'Auto Rickshaw', cap: '4' },
                  { id: 'van', label: 'Van / Omni', cap: '8' },
                  { id: 'minibus', label: 'Minibus', cap: '18' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehicleType(v.id);
                      setCapacity(v.cap);
                    }}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all ${
                      vehicleType === v.id
                        ? 'bg-[#006B2F]/10 border-[#006B2F] text-[#006B2F] font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs block leading-tight">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Registration Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Registration Number *
              </label>
              <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-3 focus-within:border-[#006B2F] transition-colors">
                <Truck className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TS09 TR 1022"
                  className="w-full text-sm font-semibold text-slate-900 outline-none uppercase bg-transparent"
                />
              </div>
            </div>

            {/* Vehicle Make & Model */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Make &amp; Model (Optional)
              </label>
              <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-3 focus-within:border-[#006B2F] transition-colors">
                <Truck className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  placeholder="e.g. Bajaj RE Compact / Force Traveller"
                  className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Operating City */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operating City
              </label>
              <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-3 focus-within:border-[#006B2F] transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent"
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bengaluru">Bengaluru</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy || !isFormValid}
              className="w-full py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all mt-2 min-h-[50px]"
            >
              {isBusy ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Verify Phone &amp; Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleConfirmSignup} className="flex flex-col gap-5 pt-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Verify Mobile Number</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter the 6-digit verification code sent to{' '}
                <span className="font-bold text-slate-800">{phoneE164}</span>
              </p>

              {debugCode && (
                <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Dev Test Code</p>
                  <p className="text-2xl font-mono font-black text-amber-900 tracking-[0.25em]">{debugCode}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                className="w-full border-2 border-slate-200 focus:border-[#006B2F] rounded-2xl py-3.5 text-center text-3xl font-mono font-black text-slate-900 tracking-[0.4em] outline-none transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isBusy || otp.length !== 6}
              className="w-full py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all min-h-[50px]"
            >
              {isBusy ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleInitiateSignup}
              disabled={resendCooldown > 0 || isBusy}
              className="text-xs text-[#006B2F] font-bold py-2 disabled:text-slate-400 transition-colors text-center"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
