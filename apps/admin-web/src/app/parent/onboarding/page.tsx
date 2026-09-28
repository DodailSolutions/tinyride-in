'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  User,
  GraduationCap,
  School,
  MapPin,
  Bus,
  Sparkles,
  KeyRound,
  Phone,
} from 'lucide-react';
import {
  getParentSession,
  completeOnboarding,
  DEFAULT_DEMO_CHILD,
} from '@/lib/parentAuth';

const SCHOOL_OPTIONS = [
  { name: 'Oakridge International School', campus: 'Gachibowli, Hyderabad' },
  { name: 'Delhi Public School (DPS)', campus: 'Khajaguda, Hyderabad' },
  { name: 'CHIREC International School', campus: 'Kondapur, Hyderabad' },
  { name: 'Silver Oaks International School', campus: 'Miyapur, Hyderabad' },
  { name: 'The Gaudium School', campus: 'Kollur, Hyderabad' },
];

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form states
  // Step 1: Parent details
  const [parentName, setParentName] = useState('Priya Sharma');
  const [relationship, setRelationship] = useState('Mother');
  const [altPhone, setAltPhone] = useState('+91 98111 22334');

  // Step 2: Child details
  const [childName, setChildName] = useState('Tanvik Mathurthi');
  const [childGrade, setChildGrade] = useState('Grade 3-A');
  const [childAge, setChildAge] = useState('8');
  const [medicalNotes, setMedicalNotes] = useState('Mild dust allergy. Inhaler kept in backpack outer pouch.');

  // Step 3: School
  const [schoolIndex, setSchoolIndex] = useState(0);

  // Step 4: Pickup & Drop
  const [pickupAddress, setPickupAddress] = useState('Gate 2, Rainbow Vistas, Hitec City');
  const [pickupTime, setPickupTime] = useState('07:35 AM');
  const [dropTime, setDropTime] = useState('02:45 PM');

  // Step 5: Transportation
  const [vehicleNumber] = useState('TS09-TR-102');
  const [vehicleModel] = useState('Force Traveller (18-Seater)');
  const [driverName] = useState('Ravi Kumar');
  const [driverPhone] = useState('+91 98765 43210');

  // Step 6: Ready
  const [safeKey] = useState('482-910');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const curr = getParentSession();
    if (curr && curr.user?.name) {
      setParentName(curr.user.name);
    }
  }, []);

  const handleNext = () => {
    if (step < 6) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    setIsSubmitting(true);

    const school = SCHOOL_OPTIONS[schoolIndex] || SCHOOL_OPTIONS[0];
    const schoolName = school ? school.name : 'Oakridge International School';
    const schoolBranch = school ? school.campus : 'Gachibowli, Hyderabad';

    completeOnboarding({
      name: childName.trim() || DEFAULT_DEMO_CHILD.name,
      grade: childGrade.trim() || DEFAULT_DEMO_CHILD.grade,
      age: parseInt(childAge) || DEFAULT_DEMO_CHILD.age,
      schoolName,
      schoolBranch,
      pickupLocation: pickupAddress.trim() || DEFAULT_DEMO_CHILD.pickupLocation,
      pickupTime,
      dropTime,
      medicalNotes: medicalNotes.trim() || undefined,
    });

    setTimeout(() => {
      router.push('/parent');
    }, 600);
  };

  const stepsList = [
    { num: 1, label: 'Parent Details' },
    { num: 2, label: 'Add Child' },
    { num: 3, label: 'School' },
    { num: 4, label: 'Pickup Stop' },
    { num: 5, label: 'Vehicle' },
    { num: 6, label: 'Confirm' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
              step === 1 ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-slate-600 hover:text-slate-900 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

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

          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-100">
            Step {step} of 6
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5">
        <div
          className="bg-[#006B2F] h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* Step Tabs Desktop / Tablet */}
        <div className="hidden sm:grid grid-cols-6 gap-2 mb-8">
          {stepsList.map((s) => {
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div
                key={s.num}
                className={`text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 border border-emerald-200'
                    : isDone
                    ? 'bg-slate-100 border border-transparent'
                    : 'opacity-40'
                }`}
              >
                <div
                  className={`w-6 h-6 mx-auto rounded-full text-xs font-bold flex items-center justify-center mb-1 ${
                    isCurrent
                      ? 'bg-[#006B2F] text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <div className="text-[11px] font-medium text-slate-700 truncate">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Step Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80">
          {/* STEP 1: Parent Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Primary Guardian</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Confirm Parent Details
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  This person will be designated as the primary contact for school pickup notices and emergency alerts.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Parent / Guardian Full Name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Relationship to Child
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mother', 'Father', 'Guardian'].map((rel) => (
                      <button
                        type="button"
                        key={rel}
                        onClick={() => setRelationship(rel)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          relationship === rel
                            ? 'bg-[#006B2F] text-white shadow-sm'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Secondary Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      placeholder="+91 98111 22334"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Add Child */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Profile</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Add Your Child
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Link your child to see their assigned vehicle, seat roster, and boarding notifications.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Child Full Name
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Tanvik Mathurthi"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Class / Grade
                    </label>
                    <input
                      type="text"
                      value={childGrade}
                      onChange={(e) => setChildGrade(e.target.value)}
                      placeholder="Grade 3-A"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      placeholder="8"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Medical or Transportation Notes</span>
                    <span className="text-[11px] font-normal text-slate-400 normal-case">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="e.g. Mild motion sickness or inhaler kept in backpack"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: School Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-2">
                  <School className="w-3.5 h-3.5" />
                  <span>Verified School Network</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Select Your Child&apos;s School
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select from our list of partnered school transportation fleets in Hyderabad:
                </p>
              </div>

              <div className="space-y-2.5">
                {SCHOOL_OPTIONS.map((sch, idx) => {
                  const isSelected = schoolIndex === idx;
                  return (
                    <button
                      type="button"
                      key={sch.name}
                      onClick={() => setSchoolIndex(idx)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#006B2F] bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSelected ? 'bg-[#006B2F] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sch.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{sch.name}</div>
                          <div className="text-xs text-slate-500">{sch.campus}</div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#006B2F] bg-[#006B2F]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Pickup & Drop Location */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Stop Configuration</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Confirm Pickup & Drop Stop
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Where should the vehicle meet your child every morning and afternoon?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designated Pickup Location / Gate
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Gate 2, Rainbow Vistas, Hitec City"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Morning Pickup
                    </label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Afternoon Drop
                    </label>
                    <input
                      type="text"
                      value={dropTime}
                      onChange={(e) => setDropTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    The driver receives this geofence on their onboard console. You will get an automatic alert when the bus is 10 minutes away.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Transportation Details */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-2">
                  <Bus className="w-3.5 h-3.5" />
                  <span>Assigned Fleet</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Your Child&apos;s Assigned Route
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Verified school transport details configured for {childName}:
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="text-xs text-emerald-900 font-semibold uppercase tracking-wider">
                    Route 14A • Hitec City Loop
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold">
                    Live Assigned
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 mb-0.5">Assigned Vehicle</div>
                    <div className="text-slate-900 font-bold text-sm">{vehicleNumber}</div>
                    <div className="text-slate-500">{vehicleModel}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">Assigned Driver</div>
                    <div className="text-slate-900 font-bold text-sm">{driverName}</div>
                    <div className="text-emerald-700 font-medium">{driverPhone}</div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 border-t border-emerald-100/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Police-verified driver & certified female attendant on board.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Done */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>All Set</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Review &amp; Generate SafeKey
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Here is your family&apos;s digital boarding card. Your account is ready to launch.
                </p>
              </div>

              {/* SafeKey Visual Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                    TinyRide SafeKey Token
                  </span>
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="text-center py-2">
                  <div className="text-3xl font-mono font-bold tracking-widest text-emerald-300">
                    {safeKey}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Present this code or tap phone during morning vehicle boarding
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">STUDENT</span>
                    <strong className="text-white">{childName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SCHOOL</span>
                    <strong className="text-white truncate block">
                      {SCHOOL_OPTIONS[schoolIndex]?.name || 'Oakridge International School'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Reassurance text */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Your child&apos;s telemetry is confidential and strictly accessible only by you, the verified driver, and school administrators.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === 6 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launch Parent App</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Support note */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Need help? Contact TinyRide School Concierge at +91 98765 43210
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.
      </footer>
    </div>
  );
}
