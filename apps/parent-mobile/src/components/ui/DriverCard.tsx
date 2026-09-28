import React from 'react';
import { RADIUS_TOKENS, SHADOW_TOKENS } from '@tinyride/design-system';

export interface DriverCardProps {
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleModel: string;
  rating?: number;
  photoUrl?: string;
  verified?: boolean;
  onCall?: () => void;
  style?: React.CSSProperties;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  name,
  phone,
  vehicleNumber,
  vehicleModel,
  rating = 4.9,
  verified = true,
  onCall,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS_TOKENS.md,
        border: '1px solid #E2E8F0',
        boxShadow: SHADOW_TOKENS.subtle,
        gap: '12px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Driver Avatar */}
        <div
          style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          {verified && (
            <span
              title="Verified Driver"
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#006B2F',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
              {name}
            </span>
            <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '2px' }}>
              ★ {rating}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
            <strong style={{ color: '#0F172A' }}>{vehicleNumber}</strong> • {vehicleModel}
          </div>
        </div>
      </div>

      {/* Call / Contact Action */}
      <a
        href={`tel:${phone}`}
        onClick={(e) => {
          if (onCall) {
            e.preventDefault();
            onCall();
          }
        }}
        aria-label={`Call driver ${name}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: RADIUS_TOKENS.md,
          backgroundColor: '#F0FDF4',
          color: '#006B2F',
          border: '1px solid #BBF7D0',
          cursor: 'pointer',
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'background-color 0.15s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
    </div>
  );
};
