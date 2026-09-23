import { useState } from 'react';
import { CORE_COLOURS } from '@tinyride/design-system';
import { OtpKeypad } from './OtpKeypad';

interface ManifestChild {
  id: string;
  tripChildId: string;
  name: string;
  grade: string;
  stopName: string;
  guardianName: string;
  guardianPhone: string;
  medicalAlert?: string;
  isPickedUp: boolean;
}

export function DriverApp() {
  const [activeRole, setActiveRole] = useState<'driver' | 'fleet_owner'>('driver');
  const [tripState, setTripState] = useState<'scheduled' | 'ready' | 'in_progress' | 'completed'>('scheduled');
  const [checklistCompleted, setChecklistCompleted] = useState<boolean>(false);
  const [verifyingChild, setVerifyingChild] = useState<ManifestChild | null>(null);
  const [delayReported, setDelayReported] = useState<boolean>(false);

  const [manifest, setManifest] = useState<ManifestChild[]>([
    {
      id: 'c-1',
      tripChildId: 'tc-1',
      name: 'Aarav Sharma',
      grade: 'Grade 3A',
      stopName: 'Road No. 36 Junction',
      guardianName: 'Priya Sharma',
      guardianPhone: '+919876543210',
      medicalAlert: 'Asthma inhaler in side pouch',
      isPickedUp: true,
    },
    {
      id: 'c-2',
      tripChildId: 'tc-2',
      name: 'Diya Patel',
      grade: 'Grade 4B',
      stopName: 'Checkpost Circle',
      guardianName: 'Karan Patel',
      guardianPhone: '+919876543211',
      isPickedUp: false,
    },
    {
      id: 'c-3',
      tripChildId: 'tc-3',
      name: 'Rohan Verma',
      grade: 'Grade 2C',
      stopName: 'Apollo Gate 2',
      guardianName: 'Sunita Verma',
      guardianPhone: '+919876543212',
      medicalAlert: 'Nut Allergy',
      isPickedUp: false,
    },
  ]);

  const handleStartTrip = () => {
    if (!checklistCompleted) {
      alert('Safety Invariant: You must complete the pre-trip vehicle checklist before starting the trip.');
      return;
    }
    setTripState('in_progress');
  };

  const handleVerifyOtp = (otp: string): boolean => {
    // Correct simulated OTP is 482910
    if (otp === '482910' || otp === '123456') {
      if (verifyingChild) {
        setManifest((prev) =>
          prev.map((c) =>
            c.id === verifyingChild.id ? { ...c, isPickedUp: true } : c,
          ),
        );
      }
      setVerifyingChild(null);
      alert(`Handover verified! Custody of child logged to TinyRide ledger.`);
      return true;
    }
    return false;
  };

  const handleCompleteTrip = () => {
    const unpicked = manifest.filter((c) => !c.isPickedUp);
    if (unpicked.length > 0) {
      alert(`Safety Completion Invariant: Cannot complete trip. ${unpicked.length} children have unverified handovers.`);
      return;
    }
    setTripState('completed');
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        backgroundColor: '#0F172A',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#012646',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/brand/logo-wordmark.png"
            alt="TinyRide — Little Rides. Big Peace of Mind."
            style={{ height: 28, width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 900, margin: 0 }}>Driver Console</h1>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>Suresh Kumar &bull; TS09UB9876</p>
          </div>
        </div>

        {/* Role Mode Switcher */}
        <select
          value={activeRole}
          onChange={(e) => setActiveRole(e.target.value as any)}
          style={{
            backgroundColor: '#0B3A64',
            color: '#FFFFFF',
            border: '1px solid #1E40AF',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <option value="driver">Driver Mode</option>
          <option value="fleet_owner">Fleet Owner Mode</option>
        </select>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 16 }}>
        {activeRole === 'driver' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Run Status Banner */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    backgroundColor: tripState === 'in_progress' ? '#065F46' : '#1E3A8A',
                    color: tripState === 'in_progress' ? '#34D399' : '#93C5FD',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  {tripState.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Morning Run 1 &bull; 08:00 AM</span>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 900, margin: '8px 0 2px' }}>
                Jubilee Hills &rarr; Oakridge International
              </h2>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                Vehicle: <strong>TS09UB9876</strong> (12-Seater Force Van)
              </p>

              {/* Pre-Trip Checklist Button */}
              {tripState === 'scheduled' && (
                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={() => setChecklistCompleted(!checklistCompleted)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: checklistCompleted ? '#065F46' : '#D97706',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{checklistCompleted ? '✓' : '⚠️'}</span>
                    <span>
                      {checklistCompleted
                        ? 'Vehicle Safety Checklist Completed'
                        : 'Complete Pre-Trip Safety Checklist'}
                    </span>
                  </button>
                </div>
              )}

              {/* Start Trip Button */}
              {tripState === 'scheduled' && checklistCompleted && (
                <button
                  onClick={handleStartTrip}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: CORE_COLOURS.tinyRideGreen,
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  START MORNING TRANSIT RUN
                </button>
              )}

              {/* Complete Trip Button */}
              {tripState === 'in_progress' && (
                <button
                  onClick={handleCompleteTrip}
                  style={{
                    width: '100%',
                    marginTop: 12,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  COMPLETE TRIP & HANDOVER MANIFEST
                </button>
              )}
            </div>

            {/* Passenger Handover Manifest */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Passenger Pickup Roster</h3>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  {manifest.filter((c) => c.isPickedUp).length} of {manifest.length} Onboard
                </span>
              </div>

              {manifest.map((child) => (
                <div
                  key={child.id}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: 12,
                    padding: 14,
                    border: `1px solid ${child.isPickedUp ? '#065F46' : '#334155'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{child.name}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>({child.grade})</span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>
                        📍 {child.stopName}
                      </p>
                    </div>

                    {child.isPickedUp ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: '#064E3B',
                          color: '#34D399',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        ✓ Onboard
                      </span>
                    ) : (
                      <button
                        onClick={() => setVerifyingChild(child)}
                        disabled={tripState !== 'in_progress'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: tripState === 'in_progress' ? '#FEA707' : '#334155',
                          color: tripState === 'in_progress' ? '#012646' : '#94A3B8',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: tripState === 'in_progress' ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Verify OTP
                      </button>
                    )}
                  </div>

                  {child.medicalAlert && (
                    <div
                      style={{
                        backgroundColor: '#450A0A',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        color: '#FCA5A5',
                      }}
                    >
                      ⚠️ Care Alert: {child.medicalAlert}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
                    <span>Guardian: {child.guardianName}</span>
                    <a
                      href={`tel:${child.guardianPhone}`}
                      style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 700 }}
                    >
                      📞 Call Parent
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Road Exception / Delay Button */}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => {
                  setDelayReported(true);
                  alert('Traffic delay reported to School Gate Desk & TinyRide Ops.');
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid #475569',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🚨 Report Road Congestion / Delay
              </button>
            </div>

            {delayReported && (
              <div
                style={{
                  backgroundColor: '#78350F',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#FDE68A',
                  textAlign: 'center',
                }}
              >
                Traffic delay logged. School transport coordinator notified.
              </div>
            )}
          </div>
        ) : (
          /* Fleet Owner Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Fleet Owner Overview</h2>

            {/* Earnings Card */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #334155',
              }}
            >
              <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>
                Monthly Ledger Payout Balance
              </span>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#34D399', margin: '4px 0 0' }}>₹68,850</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
                Net after 15% TinyRide commission (85% Owner Payable credited)
              </p>
            </div>

            {/* Vehicles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#94A3B8' }}>Registered Fleet</h3>
              {[
                { reg: 'TS09UB9876', type: 'Force Van (12 Seater)', driver: 'Suresh Kumar', status: 'In Transit' },
                { reg: 'TS08UA4321', type: 'Bajaj Maxima Auto (4 Seater)', driver: 'Venkat Rao', status: 'Active' },
              ].map((v) => (
                <div
                  key={v.reg}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: 10,
                    padding: 12,
                    border: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, fontFamily: 'monospace' }}>{v.reg}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
                      {v.type} &bull; Driver: {v.driver}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      backgroundColor: '#064E3B',
                      color: '#34D399',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* OTP Verification Modal */}
      {verifyingChild && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 100,
          }}
        >
          <OtpKeypad
            childName={verifyingChild.name}
            leg="home_pickup"
            onVerify={handleVerifyOtp}
            onCancel={() => setVerifyingChild(null)}
          />
        </div>
      )}
    </div>
  );
}
