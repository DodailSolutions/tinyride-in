import React from 'react';
import { StatusBadge, SafetyStateKey } from './Badge';
import { RADIUS_TOKENS, SHADOW_TOKENS } from '@tinyride/design-system';

export interface TripCardProps {
  childName: string;
  tripType: 'pickup' | 'dropoff';
  statusHeading: string; // e.g. "Pickup in 12 min", "Tanvik has boarded"
  statusSubtext: string;  // e.g. "ETA: 8:35 AM • Vehicle TR-102"
  stateKey: SafetyStateKey;
  vehicleNumber: string;
  driverName: string;
  schoolName: string;
  safeKeyOtp?: string;
  onTrackPress?: () => void;
  onSafeKeyPress?: () => void;
  style?: React.CSSProperties;
}

export const TripCard: React.FC<TripCardProps> = ({
  childName,
  tripType,
  statusHeading,
  statusSubtext,
  stateKey,
  vehicleNumber,
  driverName,
  schoolName,
  safeKeyOtp,
  onTrackPress,
  onSafeKeyPress,
  style,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS_TOKENS.lg,
        border: '1px solid #D7E1E8',
        boxShadow: SHADOW_TOKENS.card,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Top Banner: Child & Trip Type */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {childName[0]}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
            {childName}
          </span>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            • {tripType === 'pickup' ? 'School Morning Pickup' : 'Afternoon Drop-off'}
          </span>
        </div>

        <StatusBadge state={stateKey} size="sm" />
      </div>

      {/* Primary Status Area */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {statusHeading}
            </div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              {statusSubtext}
            </div>
          </div>

          {/* SafeKey OTP Box (Essential for Parent Handover Confidence) */}
          {safeKeyOtp && (
            <button
              onClick={onSafeKeyPress}
              title="Click to view full SafeKey Handover Token"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#F0FDF4',
                border: '1.5px dashed #006B2F',
                borderRadius: RADIUS_TOKENS.md,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#006B2F', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                SafeKey
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '2px', fontVariantNumeric: 'tabular-nums' }}>
                {safeKeyOtp}
              </span>
            </button>
          )}
        </div>

        {/* Route / School Info */}
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          <div>
            Destination: <strong style={{ color: '#0F172A' }}>{schoolName}</strong>
          </div>
          <div>
            Driver: <strong style={{ color: '#0F172A' }}>{driverName}</strong> ({vehicleNumber})
          </div>
        </div>

        {/* Action Button */}
        {onTrackPress && (
          <button
            onClick={onTrackPress}
            style={{
              width: '100%',
              marginTop: '14px',
              padding: '10px',
              backgroundColor: '#006B2F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: RADIUS_TOKENS.md,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Track Live Vehicle on Map
          </button>
        )}
      </div>
    </div>
  );
};
