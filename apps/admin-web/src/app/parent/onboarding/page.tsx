'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  MapPin,
  Bus,
  Check,
  Edit2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import {
  getParentSession,
  completeOnboarding,
  type ParentChild,
} from '@/lib/parentAuth';

const SCHOOLS_DATABASE = [
  { id: 'sch-1', name: 'Olive Mount', campus: 'Gachibowli, Hyderabad', routes: '14 Active Routes' },
  { id: 'sch-2', name: 'Delhi Public School (DPS)', campus: 'Khajaguda, Hyderabad', routes: '22 Active Routes' },
  { id: 'sch-3', name: 'CHIREC International School', campus: 'Kondapur, Hyderabad', routes: '18 Active Routes' },
  { id: 'sch-4', name: 'Silver Oaks International School', campus: 'Miyapur, Hyderabad', routes: '16 Active Routes' },
  { id: 'sch-5', name: 'The Gaudium School', campus: 'Kollur, Hyderabad', routes: '12 Active Routes' },
  { id: 'sch-6', name: 'Phoenix Greens International School', campus: 'Kokapet, Hyderabad', routes: '10 Active Routes' },
  { id: 'sch-7', name: 'Glendale Academy', campus: 'Bandlaguda, Hyderabad', routes: '14 Active Routes' },
];

export default function ParentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Steps 1 to 7, Step 8 = Success

  // STEP 1: Parent Profile
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  // STEP 2: Child Information
  const [childrenList, setChildrenList] = useState<Array<{ name: string; grade: string; notes?: string }>>([
    { name: '', grade: '', notes: '' },
  ]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // STEP 3: School Selection
  const [schoolSearch, setSchoolSearch] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('sch-1');

  // STEP 4: Pickup Location
  const [pickupAddress, setPickupAddress] = useState('Gate 2, Rainbow Vistas, Hitec City');
  const [pickupMethod, setPickupMethod] = useState<'address' | 'current' | 'map'>('address');

  // STEP 5: Transportation (Live assigned or school coordinated)
  const [assignedRoute] = useState({
    routeName: 'Route 04 (Olive Mount)',
    vehicleNumber: 'TS09-TR-102',
    vehicleModel: 'Force Traveller 18-Seater',
    driverName: 'Ravi Kumar',
    driverPhone: '+91 98765 43210',
    escortName: 'Sunita Devi (Certified Attendant)',
  });

  // STEP 6: Notifications Preferences
  const [notifications, setNotifications] = useState({
    approaching: true,
    boarded: true,
    arrived: true,
    updates: true,
  });

  // Validation errors
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSafeKey, setGeneratedSafeKey] = useState('482-910');

  useEffect(() => {
    const session = getParentSession();
    if (session?.user?.name && !parentName) {
      setParentName(session.user.name);
    }
    if (session?.user?.email && !parentEmail) {
      setParentEmail(session.user.email);
    }
    if (session?.children?.[0]) {
      const c = session.children[0];
      setChildrenList([{ name: c.name, grade: c.grade, notes: c.medicalNotes || '' }]);
      setPickupAddress(c.pickupLocation || 'Gate 2, Rainbow Vistas, Hitec City');
    }
  }, []);

  const selectedSchool =
    SCHOOLS_DATABASE.find((s) => s.id === selectedSchoolId) || SCHOOLS_DATABASE[0]!;

  const filteredSchools = SCHOOLS_DATABASE.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      s.campus.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const handleNext = () => {
    setError('');

    // Step 1 Validation
    if (step === 1) {
      if (!parentName.trim()) {
        setError('Please enter your full name.');
        return;
      }
    }

    // Step 2 Validation
    if (step === 2) {
      const curr = childrenList[activeChildIndex];
      if (!curr || !curr.name.trim()) {
        setError("Please enter your child's full name.");
        return;
      }
      if (!curr.grade.trim()) {
        setError("Please specify your child's class or grade (e.g. Grade 3-A).");
        return;
      }
    }

    // Advance
    if (step < 7) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 7) {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/parent/verify');
    }
  };

  const handleAddAnotherChild = () => {
    const curr = childrenList[activeChildIndex];
    if (!curr || !curr.name.trim()) {
      setError("Please complete the current child's name first.");
      return;
    }
    setChildrenList((prev) => [...prev, { name: '', grade: '', notes: '' }]);
    setActiveChildIndex(childrenList.length);
    setError('');
  };

  const handleCompleteOnboarding = () => {
    setIsSubmitting(true);
    const primaryChild = childrenList[0] || { name: 'Aarav Sharma', grade: '3A' };
    const randomKey = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    setGeneratedSafeKey(randomKey);

    const childData: Omit<ParentChild, 'id' | 'safeKey' | 'vehicleNumber' | 'vehicleModel' | 'driverName' | 'driverPhone'> = {
      name: primaryChild.name.trim() || 'Aarav Sharma',
      grade: primaryChild.grade.trim() || '3A',
      age: 8,
      schoolName: selectedSchool.name,
      schoolBranch: selectedSchool.campus,
      pickupLocation: pickupAddress.trim(),
      pickupTime: '8:35 AM',
      dropTime: '3:30 PM',
      medicalNotes: primaryChild.notes?.trim() || undefined,
    };

    completeOnboarding(childData, {
      name: parentName.trim(),
      email: parentEmail.trim() || undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(8); // Move to Screen 10 — Success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
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

          {/* Simple Back button (hidden on Success screen) */}
          {step <= 7 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 min-h-[44px] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </header>

      {/* 2. PROGRESS INDICATOR (Steps 1 to 7) */}
      {step <= 7 && (
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Step {step} of 7</span>
            <span className="text-[#006B2F] font-bold">
              {step === 1 && 'Parent Profile'}
              {step === 2 && 'Child Information'}
              {step === 3 && 'School Selection'}
              {step === 4 && 'Pickup Stop'}
              {step === 5 && 'Transportation'}
              {step === 6 && 'Notifications'}
              {step === 7 && 'Review Setup'}
            </span>
          </div>
          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#006B2F] h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. MAIN FORM / STEPS CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[500px]">
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/40 border border-slate-200/80">
            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 leading-normal"
              >
                {error}
              </div>
            )}

            {/* ========================================================
                SCREEN 3: PARENT PROFILE (STEP 1)
            ======================================================== */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Tell us about you
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    We&apos;ll use this information to keep your account connected to your child&apos;s ride.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="parent-full-name"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                    >
                      Full name
                    </label>
                    <input
                      id="parent-full-name"
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. Priya Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="parent-email"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between"
                    >
                      <span>Email address</span>
                      <span className="text-[11px] font-normal text-slate-400 normal-case">Optional</span>
                    </label>
                    <input
                      id="parent-email"
                      type="email"
                      placeholder="name@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[48px]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}

            {/* ========================================================
                SCREEN 4: ADD CHILD (STEP 2)
            ======================================================== */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Who is this ride for?
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Add your child to get started.
                  </p>
                </div>

                {/* Multi-child tabs if more than 1 */}
                {childrenList.length > 1 && (
                  <div className="flex gap-2 pb-1 overflow-x-auto">
                    {childrenList.map((ch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveChildIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          activeChildIndex === idx
                            ? 'bg-[#006B2F] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Child {idx + 1}: {ch.name ? ch.name.split(' ')[0] : 'New'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="child-name"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                    >
                      Child&apos;s full name
                    </label>
                    <input
                      id="child-name"
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={childrenList[activeChildIndex]?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChildrenList((prev) => {
                          const updated = [...prev];
                          if (updated[activeChildIndex]) {
                            updated[activeChildIndex] = { ...updated[activeChildIndex], name: val };
                          }
                          return updated;
                        });
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="child-grade"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                    >
                      Class / Grade
                    </label>
                    <input
                      id="child-grade"
                      type="text"
                      placeholder="e.g. 3A"
                      value={childrenList[activeChildIndex]?.grade || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChildrenList((prev) => {
                          const updated = [...prev];
                          if (updated[activeChildIndex]) {
                            updated[activeChildIndex] = { ...updated[activeChildIndex], grade: val };
                          }
                          return updated;
                        });
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="child-notes"
                      className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between"
                    >
                      <span>Medical or transportation notes</span>
                      <span className="text-[11px] font-normal text-slate-400 normal-case">Optional</span>
                    </label>
                    <input
                      id="child-notes"
                      type="text"
                      placeholder="e.g. Mild dust allergy, inhaler in pouch"
                      value={childrenList[activeChildIndex]?.notes || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChildrenList((prev) => {
                          const updated = [...prev];
                          if (updated[activeChildIndex]) {
                            updated[activeChildIndex] = { ...updated[activeChildIndex], notes: val };
                          }
                          return updated;
                        });
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                  >
                    Continue
                  </button>

                  <button
                    type="button"
                    onClick={handleAddAnotherChild}
                    className="w-full py-2.5 text-center text-xs font-bold text-[#006B2F] hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                  >
                    + Add another child
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                SCREEN 5: SELECT SCHOOL (STEP 3)
            ======================================================== */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Which school does your child attend?
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Select from authorized schools operating TinyRide routes.
                  </p>
                </div>

                {/* Search Field */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search school name or location"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[48px]"
                  />
                </div>

                {/* School List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredSchools.map((sch) => {
                    const isSelected = sch.id === selectedSchoolId;
                    return (
                      <button
                        key={sch.id}
                        type="button"
                        onClick={() => setSelectedSchoolId(sch.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#006B2F] bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900">{sch.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{sch.campus}</div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-[#006B2F] bg-[#006B2F]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                  {filteredSchools.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No schools found matching &quot;{schoolSearch}&quot;.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  Confirm school
                </button>
              </div>
            )}

            {/* ========================================================
                SCREEN 6: PICKUP LOCATION (STEP 4)
            ======================================================== */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Where should we pick up your child?
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Choose the pickup point for the school ride.
                  </p>
                </div>

                {/* 3 Options: Address, Current, Map */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupMethod('address')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pickupMethod === 'address'
                        ? 'bg-[#006B2F] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Enter Address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickupMethod('current');
                      setPickupAddress('Current Location: Rainbow Vistas, Hitec City');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pickupMethod === 'current'
                        ? 'bg-[#006B2F] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Current Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupMethod('map')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pickupMethod === 'map'
                        ? 'bg-[#006B2F] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pin on Map
                  </button>
                </div>

                {/* Address Input */}
                <div>
                  <label
                    htmlFor="pickup-address"
                    className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                  >
                    Designated Pickup Point / Gate
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="pickup-address"
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="e.g. Gate 2, Rainbow Vistas, Hitec City"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 focus:border-[#006B2F] min-h-[48px]"
                    />
                  </div>
                </div>

                {/* Map Preview Confirmation */}
                <div className="relative h-40 w-full rounded-2xl bg-[#EBF0EB] border border-slate-200/80 overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full stroke-slate-300" strokeWidth="3" fill="none">
                    <line x1="0" y1="40" x2="100%" y2="40" stroke="#d5dfd5" strokeWidth="12" />
                    <line x1="0" y1="120" x2="100%" y2="120" stroke="#d5dfd5" strokeWidth="10" />
                    <line x1="160" y1="0" x2="160" y2="100%" stroke="#d5dfd5" strokeWidth="10" />
                  </svg>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#006B2F] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="mt-1 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-slate-800 shadow-xs border border-slate-200">
                      Confirmed Pickup Gate
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  Confirm pickup point
                </button>
              </div>
            )}

            {/* ========================================================
                SCREEN 7: TRANSPORTATION (STEP 5)
            ======================================================== */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Let&apos;s connect your child&apos;s ride
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Verified transport route configured for {selectedSchool.name}.
                  </p>
                </div>

                {/* Transportation State Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-[#006B2F]" />
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        {assignedRoute.routeName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      Assigned
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500 text-[11px]">Vehicle</div>
                      <div className="font-bold text-slate-900 mt-0.5">{assignedRoute.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-500">{assignedRoute.vehicleModel}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px]">Driver</div>
                      <div className="font-bold text-slate-900 mt-0.5">{assignedRoute.driverName}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">{assignedRoute.driverPhone}</div>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-600 border-t border-emerald-100/60 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{assignedRoute.escortName}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Your school transportation department validates driver rosters and vehicle speed telemetry in real-time.
                </p>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}

            {/* ========================================================
                SCREEN 8: NOTIFICATIONS (STEP 6)
            ======================================================== */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Stay updated
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Choose how you&apos;d like TinyRide to keep you informed.
                  </p>
                </div>

                {/* Notifications Toggles */}
                <div className="space-y-2.5">
                  {[
                    {
                      key: 'approaching' as const,
                      title: 'Vehicle approaching',
                      desc: 'Get notified when the bus is 10 minutes from your stop.',
                    },
                    {
                      key: 'boarded' as const,
                      title: 'Child boarded',
                      desc: 'Instant alert when SafeKey boarding scan is verified.',
                    },
                    {
                      key: 'arrived' as const,
                      title: 'School arrival',
                      desc: 'Notice as soon as the vehicle reaches the campus gate.',
                    },
                    {
                      key: 'updates' as const,
                      title: 'Important trip updates',
                      desc: 'Traffic delays, route detours, or schedule alerts.',
                    },
                  ].map((notif) => {
                    const isChecked = notifications[notif.key];
                    return (
                      <label
                        key={notif.key}
                        className={`w-full p-3.5 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-emerald-200 bg-emerald-50/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs sm:text-sm font-bold text-slate-900">{notif.title}</div>
                          <div className="text-[11px] text-slate-500 leading-normal">{notif.desc}</div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setNotifications((prev) => ({ ...prev, [notif.key]: e.target.checked }))
                          }
                          className="mt-1 w-4 h-4 rounded text-[#006B2F] focus:ring-[#006B2F] border-slate-300 shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}

            {/* ========================================================
                SCREEN 9: REVIEW SETUP (STEP 7)
            ======================================================== */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Review your setup
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Check your details before completing registration.
                  </p>
                </div>

                {/* Review Cards */}
                <div className="space-y-2.5">
                  {/* Child */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Child
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {childrenList[0]?.name || 'Aarav Sharma'} • {childrenList[0]?.grade || '3A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-bold text-[#006B2F] hover:underline p-1 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* School */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        School
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedSchool.name}</div>
                      <div className="text-[11px] text-slate-500">{selectedSchool.campus}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-bold text-[#006B2F] hover:underline p-1 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Pickup */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pickup Point
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{pickupAddress}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-xs font-bold text-[#006B2F] hover:underline p-1 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Transportation */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Transportation
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{assignedRoute.routeName}</div>
                      <div className="text-[11px] text-slate-500">
                        {assignedRoute.vehicleNumber} • Driver {assignedRoute.driverName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="text-xs font-bold text-[#006B2F] hover:underline p-1 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Notifications */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Notifications
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        Approaching, Boarded, Arrival, Trip Updates
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="text-xs font-bold text-[#006B2F] hover:underline p-1 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={isSubmitting}
                  className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Complete setup</span>
                  )}
                </button>
              </div>
            )}

            {/* ========================================================
                SCREEN 10: SUCCESS (STEP 8)
            ======================================================== */}
            {step === 8 && (
              <div className="space-y-6 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#006B2F] flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    You&apos;re all set.
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Your TinyRide parent account is ready.
                  </p>
                </div>

                {/* SafeKey Boarding Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                      Boarding SafeKey
                    </span>
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="text-center py-1">
                    <div className="text-3xl font-mono font-bold tracking-widest text-emerald-300">
                      {generatedSafeKey}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">
                      Show code to vehicle attendant during morning pickup
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                    <span>{childrenList[0]?.name || 'Student'}</span>
                    <span className="truncate max-w-[150px]">{selectedSchool.name}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2">
                  <Link
                    href="/parent"
                    className="w-full h-12 min-h-[48px] px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center cursor-pointer"
                  >
                    View today&apos;s ride
                  </Link>

                  <Link
                    href="/"
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Go to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. MINIMAL LEGAL FOOTER */}
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
