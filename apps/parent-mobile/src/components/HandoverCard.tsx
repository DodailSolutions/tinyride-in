import { useState, useEffect } from 'react';
import { CORE_COLOURS } from '@tinyride/design-system';

export interface HandoverCardProps {
  childName: string;
  leg: 'home_pickup' | 'home_dropoff';
  otpCode: string;
  driverName: string;
  vehicleRegistration: string;
  expiresInSeconds?: number;
  onRefresh?: () => void;
}

export function HandoverCard({
  childName,
  leg,
  otpCode,
  driverName,
  vehicleRegistration,
  expiresInSeconds = 900, // 15 mins
  onRefresh,
}: HandoverCardProps) {
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpiringSoon = timeLeft < 120;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: isExpiringSoon ? '#F2555A' : CORE_COLOURS.tinyRideGreen,
        boxShadow: '0 4px 12px rgba(1, 38, 70, 0.08)',
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 10px',
            borderRadius: 6,
            backgroundColor: leg === 'home_pickup' ? '#E8F6EE' : '#FFF8E6',
            color: leg === 'home_pickup' ? CORE_COLOURS.tinyRideGreen : '#B56E02',
          }}
        >
          {leg === 'home_pickup' ? 'Morning Pickup SafeKey' : 'Afternoon Dropoff SafeKey'}
        </span>

        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isExpiringSoon ? '#F2555A' : '#526B7F',
            fontFamily: 'monospace',
          }}
        >
          ⏱ {formattedTime}
        </span>
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <p style={{ fontSize: 13, color: '#526B7F', margin: 0 }}>
          Verification code for <strong>{childName}</strong>
        </p>

        {/* 6-Digit Big OTP */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 8,
            color: CORE_COLOURS.tinyRideNavy,
            backgroundColor: '#F4F7F9',
            padding: '14px 20px',
            borderRadius: 12,
            marginTop: 10,
            border: '1px dashed #CBD5E1',
            fontFamily: 'monospace',
          }}
        >
          {otpCode}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 12,
          color: '#334155',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Driver:</span>
          <strong>{driverName}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Vehicle:</span>
          <strong style={{ fontFamily: 'monospace' }}>{vehicleRegistration}</strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#64748B',
          lineHeight: '1.4',
        }}
      >
        <span>🛡️</span>
        <span>
          Share this 6-digit code with the driver <strong>in person</strong> only when receiving your child.
        </span>
      </div>

      {timeLeft === 0 && onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            width: '100%',
            marginTop: 14,
            padding: '10px 16px',
            backgroundColor: CORE_COLOURS.tinyRideGreen,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Generate New SafeKey
        </button>
      )}
    </div>
  );
}
