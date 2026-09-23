import { CORE_COLOURS } from '@tinyride/design-system';

export interface LiveTripMapProps {
  tripStatus: 'scheduled' | 'ready' | 'in_progress' | 'completed';
  childStatus: 'scheduled' | 'picked_up' | 'at_school' | 'released_from_school' | 'dropped_off';
  childName: string;
  driverName: string;
  vehicleRegistration: string;
  currentStopName: string;
  schoolName: string;
  estimatedArrivalMinutes?: number;
}

export function LiveTripMap({
  tripStatus,
  childStatus,
  childName,
  driverName,
  vehicleRegistration,
  currentStopName,
  schoolName,
  estimatedArrivalMinutes = 8,
}: LiveTripMapProps) {
  const steps = [
    { key: 'picked_up', label: 'Home Pickup', time: '07:45 AM' },
    { key: 'at_school', label: 'School Arrival', time: '08:10 AM' },
    { key: 'released_from_school', label: 'Gate Departure', time: '03:30 PM' },
    { key: 'dropped_off', label: 'Home Dropoff', time: '04:05 PM' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 0;
      case 'at_school':
        return 1;
      case 'released_from_school':
        return 2;
      case 'dropped_off':
        return 3;
      default:
        return -1;
    }
  };

  const currentIdx = getStepIndex(childStatus);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(1, 38, 70, 0.05)',
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      {/* Live Van Tracker Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#012646',
          color: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 800 }}>LIVE TRANSIT</span>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
            {tripStatus === 'in_progress' ? 'Van is en route' : 'Scheduled Run'} &bull; ETA {estimatedArrivalMinutes}m
          </p>
        </div>

        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 12,
            backgroundColor: '#022D53',
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #1E3A8A',
          }}
        >
          {vehicleRegistration}
        </span>
      </div>

      {/* Transit Map Mock Visualizer */}
      <div
        style={{
          height: 140,
          backgroundColor: '#E2E8F0',
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 16,
          border: '1px solid #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Road line */}
        <div
          style={{
            position: 'absolute',
            width: '80%',
            height: 4,
            backgroundColor: '#94A3B8',
            borderRadius: 2,
          }}
        />
        {/* Animated Van marker */}
        <div
          style={{
            position: 'absolute',
            left: currentIdx >= 0 ? `${(currentIdx + 1) * 22}%` : '15%',
            transform: 'translateX(-50%)',
            backgroundColor: CORE_COLOURS.tinyRideGreen,
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 2,
          }}
        >
          <span>🚐</span>
          <span>TinyRide Van</span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            fontSize: 10,
            color: '#475569',
            fontWeight: 600,
          }}
        >
          📍 {currentStopName} &rarr; 🏫 {schoolName}
        </div>
      </div>

      {/* Handover Progress Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#012646', margin: 0, textTransform: 'uppercase' }}>
          Transit Journey &bull; {childName}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, textAlign: 'center' }}>
          {steps.map((st, idx) => {
            const isDone = currentIdx >= idx;
            const isCurrent = currentIdx === idx;

            return (
              <div
                key={st.key}
                style={{
                  padding: '8px 4px',
                  borderRadius: 8,
                  backgroundColor: isDone ? '#E8F6EE' : '#F8FAFC',
                  border: `1px solid ${isDone ? '#9BD7B5' : '#E2E8F0'}`,
                }}
              >
                <div style={{ fontSize: 16 }}>{isDone ? '✅' : '⚪'}</div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: isCurrent ? 800 : 600,
                    color: isDone ? CORE_COLOURS.tinyRideGreen : '#64748B',
                    margin: '4px 0 0',
                    lineHeight: '1.2',
                  }}
                >
                  {st.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Details Footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
        }}
      >
        <div>
          <span style={{ color: '#64748B' }}>Driver: </span>
          <strong style={{ color: '#012646' }}>{driverName}</strong>
        </div>
        <a
          href="tel:+919876543210"
          style={{
            color: CORE_COLOURS.tinyRideGreen,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          📞 Call Driver
        </a>
      </div>
    </div>
  );
}
