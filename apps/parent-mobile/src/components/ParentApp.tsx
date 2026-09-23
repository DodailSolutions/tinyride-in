import { useState } from 'react';
import { CORE_COLOURS } from '@tinyride/design-system';
import { HandoverCard } from './HandoverCard';
import { LiveTripMap } from './LiveTripMap';

export interface ChildProfile {
  id: string;
  fullName: string;
  grade: string;
  schoolName: string;
  medicalNotes?: string;
}

export function ParentApp() {
  const [activeTab, setActiveTab] = useState<'track' | 'safekey' | 'children' | 'routes' | 'sos'>('track');
  const [children] = useState<ChildProfile[]>([
    {
      id: 'c-1',
      fullName: 'Aarav Sharma',
      grade: 'Grade 3A',
      schoolName: 'Oakridge International School, Hyderabad',
      medicalNotes: 'Asthma inhaler in backpack side pouch',
    },
    {
      id: 'c-2',
      fullName: 'Diya Sharma',
      grade: 'Grade 1B',
      schoolName: 'Oakridge International School, Hyderabad',
    },
  ]);

  const [selectedChildId, setSelectedChildId] = useState<string>('c-1');
  const [otpCode, setOtpCode] = useState<string>('482910');
  const [absenceLogged, setAbsenceLogged] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0]!;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Mobile Top Header */}
      <header
        style={{
          backgroundColor: '#012646',
          color: '#FFFFFF',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/brand/logo-wordmark.png"
            alt="TinyRide — Little Rides. Big Peace of Mind."
            style={{ height: 32, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <button
          onClick={() => setActiveTab('sos')}
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>🚨</span>
          <span>SOS</span>
        </button>
      </header>

      {/* Child Switcher Ribbon */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '10px 16px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>Child:</span>
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedChildId === child.id ? '#012646' : '#F1F5F9',
              color: selectedChildId === child.id ? '#FFFFFF' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            {child.fullName}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <main style={{ flex: 1, padding: 16 }}>
        {activeTab === 'track' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LiveTripMap
              tripStatus="in_progress"
              childStatus="picked_up"
              childName={selectedChild.fullName}
              driverName="Suresh Kumar"
              vehicleRegistration="TS09UB9876"
              currentStopName="Road No. 36 Junction"
              schoolName={selectedChild.schoolName}
              estimatedArrivalMinutes={7}
            />

            {/* Quick SafeKey Shortcut */}
            <div
              onClick={() => setActiveTab('safekey')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🔐</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#012646' }}>
                    Active SafeKey Token
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>
                    Code: <strong style={{ fontFamily: 'monospace' }}>{otpCode}</strong> &bull; Tap to present
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#94A3B8' }}>&rarr;</span>
            </div>

            {/* Medical alert banner */}
            {selectedChild.medicalNotes && (
              <div
                style={{
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: '#9F1239',
                }}
              >
                <span>🩺</span>
                <span>
                  <strong>Medical Note:</strong> {selectedChild.medicalNotes}
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'safekey' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HandoverCard
              childName={selectedChild.fullName}
              leg="home_pickup"
              otpCode={otpCode}
              driverName="Suresh Kumar"
              vehicleRegistration="TS09UB9876"
              expiresInSeconds={840}
              onRefresh={() => setOtpCode(String(Math.floor(100000 + Math.random() * 900000)))}
            />

            <div
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                padding: 14,
                border: '1px solid #BFDBFE',
                fontSize: 12,
                color: '#1E40AF',
                lineHeight: 1.4,
              }}
            >
              <strong>Handover Security Protocol:</strong> Never share this code over the phone or SMS. The TinyRide
              driver must physically enter this code into their terminal upon taking custody of your child.
            </div>
          </div>
        )}

        {activeTab === 'children' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#012646' }}>My Children</h3>
              <button
                onClick={() => alert('New child registration form')}
                style={{
                  backgroundColor: CORE_COLOURS.tinyRideGreen,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add Child
              </button>
            </div>

            {children.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#012646' }}>{c.fullName}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                      {c.grade} &bull; {c.schoolName}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      backgroundColor: '#E8F6EE',
                      color: CORE_COLOURS.tinyRideGreen,
                      padding: '3px 8px',
                      borderRadius: 12,
                    }}
                  >
                    Active Commuter
                  </span>
                </div>

                {c.medicalNotes && (
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 11,
                      color: '#B91C1C',
                      backgroundColor: '#FEF2F2',
                      padding: '6px 10px',
                      borderRadius: 6,
                    }}
                  >
                    Allergy / Care: {c.medicalNotes}
                  </p>
                )}

                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setAbsenceLogged(true);
                      alert(`Absence recorded for ${c.fullName} for today. Daily manifest updated.`);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Absence
                  </button>
                  <button
                    onClick={() => alert(`Showing authorized guardians for ${c.fullName}`)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Guardians & Pickup
                  </button>
                </div>
              </div>
            ))}

            {absenceLogged && (
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#92400E',
                }}
              >
                ⚠️ <strong>Absence Synchronized:</strong> Your child has been removed from today's active manifest. No
                driver will be dispatched to your pickup location.
              </div>
            )}
          </div>
        )}

        {activeTab === 'routes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#012646' }}>Discover School Van Routes</h3>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #E2E8F0',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: CORE_COLOURS.tinyRideGreen,
                  backgroundColor: '#E8F6EE',
                  padding: '3px 8px',
                  borderRadius: 12,
                }}
              >
                Oakridge International Van Line
              </span>
              <h4 style={{ margin: '8px 0 2px', fontSize: 14, fontWeight: 800, color: '#012646' }}>
                Jubilee Hills Morning Run 1
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                Pickup: Checkpost Circle &bull; Arrival: 08:00 AM
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Monthly Pass:</span>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#012646' }}>₹4,500</p>
                </div>

                <button
                  onClick={() => {
                    setBookingConfirmed(true);
                    alert('Seat reserved with 10-min hold! Proceeding to Razorpay checkout...');
                  }}
                  style={{
                    backgroundColor: CORE_COLOURS.tinyRideGreen,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Book Seat
                </button>
              </div>
            </div>

            {bookingConfirmed && (
              <div
                style={{
                  backgroundColor: '#E8F6EE',
                  border: '1px solid #9BD7B5',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#06612E',
                }}
              >
                ✅ <strong>Seat Reserved:</strong> Temporary 10-minute hold active. Razorpay order initiated.
              </div>
            )}
          </div>
        )}

        {activeTab === 'sos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '20px 0' }}>
            <span style={{ fontSize: 48 }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#DC2626' }}>TinyRide Emergency SOS</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Triggering SOS immediately alerts the TinyRide Central Safety Operations Desk, school transport team, and
              initiates vehicle tracking protocols.
            </p>

            <button
              onClick={() => alert('SOS Dispatched! Central Operations Desk contacted: +91 40 8899 0011')}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '16px',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              }}
            >
              CONFIRM EMERGENCY SOS
            </button>

            <a
              href="tel:+914088990011"
              style={{
                color: '#012646',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                marginTop: 10,
              }}
            >
              Direct Dial Ops: +91 40 8899 0011
            </a>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '8px 12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          position: 'sticky',
          bottom: 0,
        }}
      >
        {[
          { key: 'track', label: 'Live Track', icon: '📍' },
          { key: 'safekey', label: 'SafeKey', icon: '🔐' },
          { key: 'children', label: 'Children', icon: '🎒' },
          { key: 'routes', label: 'Routes', icon: '🚐' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 0',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? CORE_COLOURS.tinyRideGreen : '#64748B',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
