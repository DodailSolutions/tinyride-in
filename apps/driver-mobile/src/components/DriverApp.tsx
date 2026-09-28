import { useState } from 'react';
import { RADIUS_TOKENS, SHADOW_TOKENS } from '@tinyride/design-system';
import { OtpKeypad } from './OtpKeypad';

export interface ManifestStudent {
  id: string;
  name: string;
  grade: string;
  stopName: string;
  guardianName: string;
  guardianPhone: string;
  medicalAlert?: string;
  isPickedUp: boolean;
  status: 'waiting' | 'boarded' | 'absent';
}

export function DriverApp() {
  const [tripStage, setTripStage] = useState<
    'not_started' | 'en_route_pickup' | 'at_pickup' | 'en_route_school' | 'at_school' | 'completed'
  >('not_started');
  
  const [isChecklistOpen, setIsChecklistOpen] = useState<boolean>(false);
  const [checklist, setChecklist] = useState({
    tyres: true,
    firstAid: true,
    safetyBelts: true,
  });
  const [verifyingStudent, setVerifyingStudent] = useState<ManifestStudent | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [delayReported, setDelayReported] = useState<boolean>(false);

  const [manifest, setManifest] = useState<ManifestStudent[]>([
    {
      id: 's-1',
      name: 'Kavya Reddy',
      grade: 'Grade 3A',
      stopName: 'Road No. 10 Banjara Hills',
      guardianName: 'Suresh Reddy',
      guardianPhone: '+919876543201',
      isPickedUp: true,
      status: 'boarded',
    },
    {
      id: 's-2',
      name: 'Vivaan Joshi',
      grade: 'Grade 2B',
      stopName: 'Jubilee Hills Checkpost',
      guardianName: 'Neha Joshi',
      guardianPhone: '+919876543202',
      isPickedUp: true,
      status: 'boarded',
    },
    {
      id: 's-3',
      name: 'Aarav Sharma',
      grade: 'Grade 3A',
      stopName: 'Villa 14, Rainbow Meadows',
      guardianName: 'Priya Sharma',
      guardianPhone: '+919876543210',
      medicalAlert: 'Carries inhaler in side pouch',
      isPickedUp: false,
      status: 'waiting',
    },
    {
      id: 's-4',
      name: 'Rohan Verma',
      grade: 'Grade 4C',
      stopName: 'Apollo Gate 2',
      guardianName: 'Sunita Verma',
      guardianPhone: '+919876543212',
      medicalAlert: 'Nut Allergy',
      isPickedUp: false,
      status: 'waiting',
    },
    {
      id: 's-5',
      name: 'Diya Patel',
      grade: 'Grade 1B',
      stopName: 'Prashasan Nagar',
      guardianName: 'Karan Patel',
      guardianPhone: '+919876543211',
      isPickedUp: false,
      status: 'waiting',
    },
  ]);

  const boardedCount = manifest.filter(s => s.status === 'boarded').length;
  const totalCount = manifest.length;
  const currentStudent = manifest[currentStopIndex] || manifest[2]!;

  const handleStartTrip = () => {
    setIsChecklistOpen(true);
  };

  const confirmStartTrip = () => {
    setIsChecklistOpen(false);
    setTripStage('en_route_pickup');
  };

  const handleArriveAtStop = () => {
    setTripStage('at_pickup');
  };

  const handleOpenOtp = (student: ManifestStudent) => {
    setVerifyingStudent(student);
  };

  const handleVerifyOtp = async (_otp: string): Promise<boolean> => {
    if (!verifyingStudent) return false;
    // Simulate verification
    setManifest(prev =>
      prev.map(s => s.id === verifyingStudent.id ? { ...s, isPickedUp: true, status: 'boarded' } : s)
    );
    setVerifyingStudent(null);
    return true;
  };

  const handleDepartStop = () => {
    if (currentStopIndex < manifest.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
      setTripStage('en_route_pickup');
    } else {
      setTripStage('en_route_school');
    }
  };

  const handleArriveSchool = () => {
    setTripStage('at_school');
  };

  const handleCompleteHandover = () => {
    setTripStage('completed');
  };

  const handleReportDelay = () => {
    setDelayReported(true);
    setTimeout(() => setDelayReported(false), 5000);
  };

  return (
    <div
      style={{
        maxWidth: 440,
        margin: '0 auto',
        backgroundColor: '#0F172A',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
        color: '#FFFFFF',
      }}
    >
      {/* 1. In-Cab Top Bar: High contrast, large text */}
      <header
        style={{
          backgroundColor: '#1E293B',
          padding: '16px 20px',
          borderBottom: '2px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Driver Console • TS09-TR-102
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            Ravi Kumar
          </div>
        </div>

        {/* Emergency SOS Button */}
        <button
          onClick={() => setIsSosOpen(true)}
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: RADIUS_TOKENS.sm,
            padding: '10px 14px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          SOS
        </button>
      </header>

      {/* Main Body */}
      <main style={{ flexGrow: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
        {/* Route & Progress Summary Card */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: RADIUS_TOKENS.lg,
            padding: '16px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#006B2F', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: RADIUS_TOKENS.sm }}>
                ROUTE M-04
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 0 0' }}>
                Delhi Public School Morning Run
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#86EFAC', fontVariantNumeric: 'tabular-nums' }}>
                {boardedCount} / {totalCount}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                Children Boarded
              </div>
            </div>
          </div>

          {delayReported && (
            <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: RADIUS_TOKENS.sm, fontSize: '12px', fontWeight: 700 }}>
              ⏱️ +10 min Traffic Delay broadcasted to Parents & School.
            </div>
          )}
        </div>

        {/* 2. NEXT PICKUP FOCUS CARD (Section 11) */}
        {tripStage !== 'completed' && tripStage !== 'not_started' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              borderRadius: RADIUS_TOKENS.lg,
              padding: '20px',
              border: '2px solid #006B2F',
              boxShadow: SHADOW_TOKENS.card,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                {tripStage === 'en_route_school' || tripStage === 'at_school'
                  ? 'Destination'
                  : `Next Stop (${currentStopIndex + 1} of ${manifest.length})`}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#006B2F', backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: RADIUS_TOKENS.sm }}>
                {tripStage === 'at_pickup' ? 'VEHICLE AT GATE' : 'EN ROUTE'}
              </span>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              {tripStage === 'en_route_school' || tripStage === 'at_school'
                ? 'Delhi Public School, Khajaguda'
                : currentStudent.stopName}
            </div>

            {tripStage !== 'en_route_school' && tripStage !== 'at_school' && (
              <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: RADIUS_TOKENS.md, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                      {currentStudent.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      {currentStudent.grade} • Guardian: {currentStudent.guardianName}
                    </div>
                  </div>

                  <a
                    href={`tel:${currentStudent.guardianPhone}`}
                    aria-label="Call Parent"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#F0FDF4',
                      color: '#006B2F',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </a>
                </div>

                {currentStudent.medicalAlert && (
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#92400E', backgroundColor: '#FEF3C7', padding: '6px 10px', borderRadius: RADIUS_TOKENS.sm }}>
                    ⚠️ {currentStudent.medicalAlert}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. PRIMARY IN-CAB DRIVER ACTION BUTTON (Section 10 - Large, Obvious Actions) */}
        <div>
          {tripStage === 'not_started' && (
            <button
              onClick={handleStartTrip}
              style={{
                width: '100%',
                height: '60px',
                backgroundColor: '#006B2F',
                color: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                border: 'none',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0, 107, 47, 0.4)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              START MORNING ROUTE
            </button>
          )}

          {tripStage === 'en_route_pickup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleArriveAtStop}
                style={{
                  width: '100%',
                  height: '60px',
                  backgroundColor: '#006B2F',
                  color: '#FFFFFF',
                  borderRadius: RADIUS_TOKENS.md,
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                ARRIVED AT PICKUP GATE
              </button>

              <button
                onClick={handleReportDelay}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  borderRadius: RADIUS_TOKENS.md,
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Report Traffic Slowdown (+10 min)
              </button>
            </div>
          )}

          {tripStage === 'at_pickup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleOpenOtp(currentStudent)}
                style={{
                  width: '100%',
                  height: '60px',
                  backgroundColor: '#006B2F',
                  color: '#FFFFFF',
                  borderRadius: RADIUS_TOKENS.md,
                  border: 'none',
                  fontSize: '17px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                VERIFY SAFEKEY & BOARD {currentStudent.name.toUpperCase()}
              </button>

              <button
                onClick={handleDepartStop}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#334155',
                  color: '#FFFFFF',
                  borderRadius: RADIUS_TOKENS.md,
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                DEPART TO NEXT STOP →
              </button>
            </div>
          )}

          {tripStage === 'en_route_school' && (
            <button
              onClick={handleArriveSchool}
              style={{
                width: '100%',
                height: '60px',
                backgroundColor: '#006B2F',
                color: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                border: 'none',
                fontSize: '18px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ARRIVED AT SCHOOL BUS BAY
            </button>
          )}

          {tripStage === 'at_school' && (
            <button
              onClick={handleCompleteHandover}
              style={{
                width: '100%',
                height: '60px',
                backgroundColor: '#006B2F',
                color: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                border: 'none',
                fontSize: '18px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              CONFIRM SCHOOL GATE HANDOVER (ALL STUDENTS)
            </button>
          )}

          {tripStage === 'completed' && (
            <div
              style={{
                padding: '24px',
                backgroundColor: '#1E293B',
                borderRadius: RADIUS_TOKENS.lg,
                textAlign: 'center',
                border: '1px solid #334155',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#006B2F', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
                Morning Route Complete
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                All {totalCount} students safely checked in at Delhi Public School.
              </p>
            </div>
          )}
        </div>

        {/* 4. PASSENGER MANIFEST CHECKLIST (Section 10 & 11) */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: RADIUS_TOKENS.md,
            padding: '16px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Passenger Roster ({boardedCount}/{totalCount})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {manifest.map((student, idx) => {
              const isCurrent = idx === currentStopIndex;
              return (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    backgroundColor: isCurrent ? '#334155' : '#0F172A',
                    borderRadius: RADIUS_TOKENS.md,
                    border: isCurrent ? '1.5px solid #86EFAC' : '1px solid #1E293B',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: student.status === 'boarded' ? '#006B2F' : '#475569',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {student.status === 'boarded' ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {student.stopName}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: RADIUS_TOKENS.sm,
                      backgroundColor: student.status === 'boarded' ? '#006B2F' : '#334155',
                      color: student.status === 'boarded' ? '#FFFFFF' : '#94A3B8',
                    }}
                  >
                    {student.status === 'boarded' ? 'BOARDED' : 'WAITING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Pre-Trip Inspection Checklist Modal */}
      {isChecklistOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#1E293B',
              borderRadius: RADIUS_TOKENS.lg,
              padding: '24px',
              border: '1px solid #334155',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Pre-Trip Safety Sign-Off
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 16px 0' }}>
              Confirm your vehicle condition before passengers board:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {[
                { key: 'tyres' as const, label: 'Tyre pressure & brakes verified' },
                { key: 'firstAid' as const, label: 'First aid kit & emergency kit onboard' },
                { key: 'safetyBelts' as const, label: 'Seat belts / doors fully functional' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#0F172A',
                    borderRadius: RADIUS_TOKENS.md,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    style={{ width: 20, height: 20, accentColor: '#006B2F' }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={confirmStartTrip}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#006B2F',
                color: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign Off & Start Route
            </button>
          </div>
        </div>
      )}

      {/* SafeKey OTP Keypad Modal */}
      {verifyingStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '20px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: RADIUS_TOKENS.lg, padding: '20px', color: '#0F172A' }}>
            <OtpKeypad
              childName={verifyingStudent.name}
              leg="home_pickup"
              onVerify={handleVerifyOtp}
              onCancel={() => setVerifyingStudent(null)}
            />
          </div>
        </div>
      )}

      {/* Driver SOS Dialog */}
      {isSosOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#1E293B',
              borderRadius: RADIUS_TOKENS.lg,
              padding: '24px',
              border: '2px solid #DC2626',
              textAlign: 'center',
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#DC2626', color: '#FFFFFF', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              Emergency Assistance Desk
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px 0' }}>
              Connect directly with School Security Gate and Central Operations:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="tel:+918000555999"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  borderRadius: RADIUS_TOKENS.md,
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '15px',
                }}
              >
                Call School Security Gate
              </a>

              <a
                href="tel:+918000555998"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  backgroundColor: '#334155',
                  color: '#FFFFFF',
                  borderRadius: RADIUS_TOKENS.md,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                Call Fleet Dispatcher
              </a>

              <button
                onClick={() => setIsSosOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
