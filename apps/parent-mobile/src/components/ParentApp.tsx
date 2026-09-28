import { useState } from 'react';
import { RADIUS_TOKENS, SHADOW_TOKENS, UX_STRINGS } from '@tinyride/design-system';
import { Button } from './ui/Button';
import { StatusBadge, SafetyStateKey } from './ui/Badge';
import { ChildSelector, ChildItem } from './ui/ChildSelector';
import { DriverCard } from './ui/DriverCard';
import { JourneyTimeline, TimelineStep } from './ui/JourneyTimeline';
import { MapPanel } from './ui/MapPanel';
import { TripCard } from './ui/TripCard';
import { NotificationItem, NotificationType } from './ui/NotificationItem';
import { BottomSheet } from './ui/BottomSheet';
import { EmptyState, ErrorState } from './ui/FeedbackStates';

export interface ChildData {
  id: string;
  name: string;
  grade: string;
  schoolName: string;
  schoolBranch: string;
  pickupLocation: string;
  pickupTime: string;
  dropTime: string;
  safeKey: string;
  tripStatus: 'waiting' | 'en_route' | 'boarded' | 'at_school';
  statusHeading: string;
  statusSubtext: string;
  stateKey: SafetyStateKey;
  vehicleNumber: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehicleEta: string;
  currentStopName: string;
  medicalNotes: string;
  guardians: Array<{ name: string; relation: string; phone: string; isPrimary: boolean }>;
  timeline: TimelineStep[];
}

export function ParentApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'tracking' | 'notifications' | 'profile'>('home');
  const [selectedChildId, setSelectedChildId] = useState<string>('c-1');
  const [isSafeKeyModalOpen, setIsSafeKeyModalOpen] = useState<boolean>(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState<boolean>(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [, setAbsenceConfirmed] = useState<boolean>(false);
  const [absenceReason, setAbsenceReason] = useState<string>('Doctor Appointment');
  const [hasConnectionError, setHasConnectionError] = useState<boolean>(false);

  // Multi-child database state
  const [childrenData, setChildrenData] = useState<Record<string, ChildData>>({
    'c-1': {
      id: 'c-1',
      name: 'Tanvik',
      grade: 'Grade 3-A',
      schoolName: 'Delhi Public School',
      schoolBranch: 'Khajaguda, Hyderabad',
      pickupLocation: 'Villa 14, Rainbow Meadows, Jubilee Hills',
      pickupTime: '07:35 AM',
      dropTime: '02:45 PM',
      safeKey: '482-910',
      tripStatus: 'en_route',
      statusHeading: 'Pickup in 12 min',
      statusSubtext: 'Driver Ravi Kumar is 1.8 km away • Approaching Stop 3',
      stateKey: 'normal',
      vehicleNumber: 'TS09-TR-102',
      vehicleModel: 'Bajaj RE Electric (6-seater)',
      driverName: 'Ravi Kumar',
      driverPhone: '+919876543210',
      driverRating: 4.92,
      vehicleEta: '8:35 AM',
      currentStopName: 'Road No. 36 Junction',
      medicalNotes: 'Carries inhaler in backpack side pouch. Mild dust allergy.',
      guardians: [
        { name: 'Priya Sharma', relation: 'Mother (Primary)', phone: '+91 98765 43210', isPrimary: true },
        { name: 'Rajesh Sharma', relation: 'Father', phone: '+91 98765 43211', isPrimary: false },
      ],
      timeline: [
        { id: 't-1', time: '07:15', title: 'Driver started route', subtitle: 'Depot dispatch cleared', status: 'completed' },
        { id: 't-2', time: '07:28', title: 'Stop 1 & 2 boarded', subtitle: 'Kavya & Vivaan safely aboard', status: 'completed' },
        { id: 't-3', time: '07:35', title: 'Pickup approaching', subtitle: 'Rainbow Meadows gate', status: 'active' },
        { id: 't-4', time: '07:40', title: 'SafeKey Verification', subtitle: 'Boarding confirmation', status: 'upcoming' },
        { id: 't-5', time: '08:05', title: 'Scheduled Arrival', subtitle: 'Delhi Public School Gate 2', status: 'upcoming' },
      ],
    },
    'c-2': {
      id: 'c-2',
      name: 'Ananya',
      grade: 'Grade 1-B',
      schoolName: 'Oakridge International School',
      schoolBranch: 'Gachibowli, Hyderabad',
      pickupLocation: 'Villa 14, Rainbow Meadows, Jubilee Hills',
      pickupTime: '08:15 AM',
      dropTime: '03:15 PM',
      safeKey: '739-142',
      tripStatus: 'waiting',
      statusHeading: 'Trip starts in 40 min',
      statusSubtext: 'Driver Mohammed Azhar • Vehicle TS09-TR-108',
      stateKey: 'normal',
      vehicleNumber: 'TS09-TR-108',
      vehicleModel: 'Force Urbania (12-seater)',
      driverName: 'Mohammed Azhar',
      driverPhone: '+919876543222',
      driverRating: 4.88,
      vehicleEta: '8:15 AM',
      currentStopName: 'Banjara Hills Depot',
      medicalNotes: 'No known allergies. Child wears spectacles.',
      guardians: [
        { name: 'Priya Sharma', relation: 'Mother (Primary)', phone: '+91 98765 43210', isPrimary: true },
        { name: 'Rajesh Sharma', relation: 'Father', phone: '+91 98765 43211', isPrimary: false },
      ],
      timeline: [
        { id: 'a-1', time: '07:50', title: 'Vehicle pre-trip check', subtitle: 'Depot preparation', status: 'completed' },
        { id: 'a-2', time: '08:00', title: 'Driver en route to Route Start', subtitle: 'On schedule', status: 'active' },
        { id: 'a-3', time: '08:15', title: 'Scheduled Pickup', subtitle: 'Rainbow Meadows', status: 'upcoming' },
        { id: 'a-4', time: '08:45', title: 'Arrival at Oakridge Gate 1', subtitle: 'Staff handover', status: 'upcoming' },
      ],
    },
  });

  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>>([
    {
      id: 'n-1',
      type: 'eta',
      title: "Vehicle approaching pickup",
      message: UX_STRINGS.notifications.fiveMinAway('Tanvik'),
      timestamp: '7:30 AM',
      isRead: false,
    },
    {
      id: 'n-2',
      type: 'general',
      title: "Morning route dispatched",
      message: "Driver Ravi Kumar started Route M-04 on time.",
      timestamp: '7:15 AM',
      isRead: true,
    },
    {
      id: 'n-3',
      type: 'arrival',
      title: "Yesterday's Drop-off Verified",
      message: "Tanvik reached Delhi Public School safely. Handover verified by Gate Staff.",
      timestamp: 'Yesterday, 8:04 AM',
      isRead: true,
    },
    {
      id: 'n-4',
      type: 'boarded',
      title: "SafeKey OTP Verified",
      message: "SafeKey 482-910 accepted by driver Ravi Kumar at pickup point.",
      timestamp: 'Yesterday, 7:36 AM',
      isRead: true,
    },
  ]);

  const currentChild = childrenData[selectedChildId] || childrenData['c-1']!;
  const childrenList: ChildItem[] = Object.values(childrenData).map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    schoolName: c.schoolName,
  }));

  const handleSimulateBoarding = () => {
    setChildrenData((prev) => ({
      ...prev,
      [selectedChildId]: {
        ...prev[selectedChildId]!,
        tripStatus: 'boarded',
        statusHeading: `${prev[selectedChildId]!.name} has boarded`,
        statusSubtext: `SafeKey verified • En route to ${prev[selectedChildId]!.schoolName}`,
        timeline: prev[selectedChildId]!.timeline.map((step) =>
          step.id === 't-3' ? { ...step, status: 'completed' } :
          step.id === 't-4' ? { ...step, status: 'active', title: `${prev[selectedChildId]!.name} Boarded` } : step
        ),
      },
    }));
  };

  const handleSimulateArrival = () => {
    setChildrenData((prev) => ({
      ...prev,
      [selectedChildId]: {
        ...prev[selectedChildId]!,
        tripStatus: 'at_school',
        statusHeading: `Arrived at ${prev[selectedChildId]!.schoolName}`,
        statusSubtext: `Safely handed over to Gate Staff • 8:04 AM`,
        stateKey: 'completed',
        timeline: prev[selectedChildId]!.timeline.map((step) => ({ ...step, status: 'completed' })),
      },
    }));
  };

  const handleMarkAbsence = () => {
    setAbsenceConfirmed(true);
    setIsAbsenceModalOpen(false);
    setChildrenData((prev) => ({
      ...prev,
      [selectedChildId]: {
        ...prev[selectedChildId]!,
        tripStatus: 'waiting',
        statusHeading: 'Absence Reported for Today',
        statusSubtext: `Driver & School Roster notified: ${absenceReason}`,
        stateKey: 'completed',
      },
    }));
  };

  return (
    <div
      style={{
        maxWidth: 440,
        margin: '0 auto',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Plus Jakarta Sans, Inter, -apple-system, sans-serif',
        color: '#0F172A',
        boxShadow: '0 0 40px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {/* 1. Header Bar: Friendly, Calm, Professional */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px 12px',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Welcome back
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Priya Sharma
            </div>
          </div>

          {/* Emergency / Safety Button: Clear, non-dominant */}
          <button
            onClick={() => setIsSosModalOpen(true)}
            aria-label="Safety & Emergency Desk"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: RADIUS_TOKENS.sm,
              color: '#DC2626',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Safety
          </button>
        </div>

        {/* Multi-Child Switcher */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ChildSelector
            childrenList={childrenList}
            selectedId={selectedChildId}
            onSelect={(id) => setSelectedChildId(id)}
          />
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {currentChild.grade}
          </span>
        </div>
      </header>

      {/* Main Screen Content Router */}
      <main style={{ flexGrow: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>
        {/* Connection Error Banner if active */}
        {hasConnectionError && (
          <ErrorState
            title={UX_STRINGS.errors.connectionLost.title}
            message={UX_STRINGS.errors.connectionLost.message}
            onRetry={() => setHasConnectionError(false)}
          />
        )}

        {/* TAB 1: PARENT HOME SCREEN (Section 6 & 7) */}
        {activeTab === 'home' && (
          <>
            {/* Trip Card with Instant Transportation Status */}
            <TripCard
              childName={currentChild.name}
              tripType="pickup"
              statusHeading={currentChild.statusHeading}
              statusSubtext={currentChild.statusSubtext}
              stateKey={currentChild.stateKey}
              vehicleNumber={currentChild.vehicleNumber}
              driverName={currentChild.driverName}
              schoolName={currentChild.schoolName}
              safeKeyOtp={currentChild.safeKey}
              onTrackPress={() => setActiveTab('tracking')}
              onSafeKeyPress={() => setIsSafeKeyModalOpen(true)}
            />

            {/* Useful Map View: Not decorative, focused on current vehicle location */}
            <MapPanel
              vehicleEta={currentChild.vehicleEta}
              vehicleNumber={currentChild.vehicleNumber}
              routeTitle={`Route M-04 • ${currentChild.schoolName}`}
              currentStopName={currentChild.currentStopName}
              schoolName={currentChild.schoolName}
              onExpand={() => setActiveTab('tracking')}
            />

            {/* Driver Profile & Contact Block */}
            <DriverCard
              name={currentChild.driverName}
              phone={currentChild.driverPhone}
              vehicleNumber={currentChild.vehicleNumber}
              vehicleModel={currentChild.vehicleModel}
              rating={currentChild.driverRating}
            />

            {/* Child Journey Timeline (Section 8) */}
            <JourneyTimeline steps={currentChild.timeline} />

            {/* Quick Actions: Absence & Trip Testing Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setIsAbsenceModalOpen(true)}
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              >
                Report Absence
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setIsSafeKeyModalOpen(true)}
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              >
                SafeKey Token
              </Button>
            </div>

            {/* Interactive Simulation Bar for Visual QA */}
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
              }}
            >
              <span style={{ color: '#64748B', fontWeight: 600 }}>Simulate State:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleSimulateBoarding}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#DCFCE7',
                    color: '#006B2F',
                    border: '1px solid #86EFAC',
                    borderRadius: RADIUS_TOKENS.sm,
                    cursor: 'pointer',
                  }}
                >
                  Boarded
                </button>
                <button
                  onClick={handleSimulateArrival}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#E2E8F0',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: RADIUS_TOKENS.sm,
                    cursor: 'pointer',
                  }}
                >
                  At School
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: PARENT TRIP TRACKING SCREEN (Section 16 - Map dominant + small bottom sheet) */}
        {activeTab === 'tracking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab('home')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#006B2F',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ← Back to Overview
              </button>
              <StatusBadge state={currentChild.stateKey} />
            </div>

            {/* Large Visually Dominant Map */}
            <MapPanel
              vehicleEta={currentChild.vehicleEta}
              vehicleNumber={currentChild.vehicleNumber}
              routeTitle={`Route M-04 • ${currentChild.schoolName}`}
              currentStopName={currentChild.currentStopName}
              schoolName={currentChild.schoolName}
              height={360}
            />

            {/* Contextual Bottom Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                padding: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: SHADOW_TOKENS.card,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                    {currentChild.statusHeading}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                    Route: Home → {currentChild.schoolName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>ETA</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#006B2F' }}>
                    {currentChild.vehicleEta}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <DriverCard
                  name={currentChild.driverName}
                  phone={currentChild.driverPhone}
                  vehicleNumber={currentChild.vehicleNumber}
                  vehicleModel={currentChild.vehicleModel}
                  rating={currentChild.driverRating}
                />
              </div>
            </div>

            <JourneyTimeline steps={currentChild.timeline} />
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS SCREEN (Section 15) */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Notifications
              </h2>
              <button
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#006B2F',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark all as read
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: SHADOW_TOKENS.subtle,
              }}
            >
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    id={n.id}
                    type={n.type}
                    title={n.title}
                    message={n.message}
                    timestamp={n.timestamp}
                    isRead={n.isRead}
                    onPress={() => {
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  title={UX_STRINGS.emptyStates.noNotifications.title}
                  message={UX_STRINGS.emptyStates.noNotifications.message}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CHILD & FAMILY PROFILE SCREEN (Section 5 & 9) */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Child Profile
              </h2>
              <StatusBadge state="normal" label="Enrolled 2026-27" />
            </div>

            {/* Profile Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                padding: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: SHADOW_TOKENS.subtle,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 800,
                  }}
                >
                  {currentChild.name[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {currentChild.name} Sharma
                  </h3>
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                    {currentChild.grade} • {currentChild.schoolName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Campus: {currentChild.schoolBranch}
                  </div>
                </div>
              </div>

              {/* Stop & Route Details */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: '#64748B' }}>Assigned Stop: </span>
                  <strong style={{ color: '#0F172A' }}>{currentChild.pickupLocation}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Standard Pickup: </span>
                  <strong style={{ color: '#0F172A' }}>{currentChild.pickupTime}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Standard Drop-off: </span>
                  <strong style={{ color: '#0F172A' }}>{currentChild.dropTime}</strong>
                </div>
              </div>
            </div>

            {/* Medical / Care Notes */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                padding: '16px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Health & Safety Instructions
              </div>
              <div style={{ fontSize: '13px', color: '#0F172A', backgroundColor: '#FFFBEB', padding: '10px 12px', borderRadius: RADIUS_TOKENS.sm, border: '1px solid #FDE68A' }}>
                ⚠️ {currentChild.medicalNotes}
              </div>
            </div>

            {/* Designated Guardians */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: RADIUS_TOKENS.md,
                padding: '16px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Authorized Pickers / Guardians
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentChild.guardians.map((g, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: RADIUS_TOKENS.sm,
                      fontSize: '13px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{g.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>{g.relation}</div>
                    </div>
                    <div style={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                      {g.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Section 20: Home, Trips, Notifications, Profile) */}
      <nav
        aria-label="Parent Bottom Navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0 12px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setActiveTab('home')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'home' ? '#006B2F' : '#64748B',
            cursor: 'pointer',
            padding: '4px 12px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'home' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'home' ? 700 : 500 }}>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'tracking' ? '#006B2F' : '#64748B',
            cursor: 'pointer',
            padding: '4px 12px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'tracking' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'tracking' ? 700 : 500 }}>Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'notifications' ? '#006B2F' : '#64748B',
            cursor: 'pointer',
            padding: '4px 12px',
            position: 'relative',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'notifications' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {notifications.some(n => !n.isRead) && (
            <span style={{ position: 'absolute', top: 3, right: 18, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#006B2F' }} />
          )}
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'notifications' ? 700 : 500 }}>Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: activeTab === 'profile' ? '#006B2F' : '#64748B',
            cursor: 'pointer',
            padding: '4px 12px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'profile' ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'profile' ? 700 : 500 }}>Profile</span>
        </button>
      </nav>

      {/* SafeKey Handover Bottom Sheet Modal */}
      <BottomSheet
        isOpen={isSafeKeyModalOpen}
        onClose={() => setIsSafeKeyModalOpen(false)}
        title="SafeKey Verification"
        subtitle={`Present this code to driver ${currentChild.driverName} at pickup`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
          <div
            style={{
              padding: '16px 28px',
              backgroundColor: '#F0FDF4',
              borderRadius: RADIUS_TOKENS.md,
              border: '2px dashed #006B2F',
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '4px',
              color: '#0F172A',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {currentChild.safeKey}
          </div>

          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '14px', lineHeight: 1.5, maxWidth: '300px' }}>
            This code updates automatically every morning. The driver cannot depart without validating this code.
          </p>

          <Button
            variant="primary"
            fullWidth
            onClick={() => setIsSafeKeyModalOpen(false)}
            style={{ marginTop: '16px' }}
          >
            Done
          </Button>
        </div>
      </BottomSheet>

      {/* Report Absence Bottom Sheet */}
      <BottomSheet
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        title="Report Student Absence"
        subtitle={`Notify school transport desk that ${currentChild.name} will not travel today`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
              Reason for Absence
            </label>
            <select
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: RADIUS_TOKENS.md,
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="Doctor Appointment">Medical / Doctor Appointment</option>
              <option value="Family Travel">Family Travel</option>
              <option value="Parent Drop-off">Parent will drop directly to school</option>
              <option value="Sick Leave">Sick / Unwell</option>
            </select>
          </div>

          <div style={{ fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: RADIUS_TOKENS.sm, border: '1px solid #E2E8F0' }}>
            ℹ️ Submitting this will update the driver's manifest immediately so the vehicle will not wait at your gate.
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Button variant="outline" fullWidth onClick={() => setIsAbsenceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleMarkAbsence}>
              Confirm Absence
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Safety & SOS Emergency Bottom Sheet */}
      <BottomSheet
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        title="TinyRide Safety Desk"
        subtitle="Immediate 24x7 escalation desk for parents"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: RADIUS_TOKENS.md, border: '1px solid #FCA5A5' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B' }}>
              Emergency Assistance Available
            </div>
            <p style={{ fontSize: '12px', color: '#7F1D1D', margin: '4px 0 0 0' }}>
              If your vehicle is facing an urgent safety hazard or has broken down, call our dedicated dispatcher.
            </p>
          </div>

          <a
            href="tel:+918000555999"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              borderRadius: RADIUS_TOKENS.md,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call 24/7 Safety Dispatcher (Toll-Free)
          </a>

          <a
            href={`tel:${currentChild.driverPhone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#F1F5F9',
              color: '#0F172A',
              borderRadius: RADIUS_TOKENS.md,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid #CBD5E1',
            }}
          >
            Call Driver ({currentChild.driverName})
          </a>
        </div>
      </BottomSheet>
    </div>
  );
}
