import React from 'react';
import { RADIUS_TOKENS, SHADOW_TOKENS } from '@tinyride/design-system';

export interface MapPanelProps {
  vehicleEta: string;
  vehicleNumber: string;
  routeTitle: string;
  currentStopName: string;
  schoolName: string;
  isVehicleMoving?: boolean;
  height?: number | string;
  onExpand?: () => void;
  style?: React.CSSProperties;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  vehicleEta,
  vehicleNumber,
  routeTitle,
  currentStopName,
  schoolName,
  isVehicleMoving = true,
  height = 280,
  onExpand,
  style,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        backgroundColor: '#EBF3EB',
        borderRadius: RADIUS_TOKENS.lg,
        overflow: 'hidden',
        border: '1px solid #D7E1E8',
        boxShadow: SHADOW_TOKENS.card,
        ...style,
      }}
    >
      {/* SVG Map Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 280"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        {/* Background Land & Parks */}
        <rect width="400" height="280" fill="#F4F8F4" />
        {/* Green park patches */}
        <path d="M 20 20 Q 80 10 90 70 T 30 110 Z" fill="#E2F0E2" opacity="0.8" />
        <path d="M 310 160 Q 370 140 380 200 T 320 250 Z" fill="#E2F0E2" opacity="0.8" />

        {/* Major Grid Roads */}
        <line x1="0" y1="80" x2="400" y2="80" stroke="#FFFFFF" strokeWidth="12" />
        <line x1="0" y1="80" x2="400" y2="80" stroke="#E2E8F0" strokeWidth="10" />

        <line x1="0" y1="200" x2="400" y2="200" stroke="#FFFFFF" strokeWidth="10" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="#E2E8F0" strokeWidth="8" />

        <line x1="90" y1="0" x2="90" y2="280" stroke="#FFFFFF" strokeWidth="10" />
        <line x1="90" y1="0" x2="90" y2="280" stroke="#E2E8F0" strokeWidth="8" />

        <line x1="310" y1="0" x2="310" y2="280" stroke="#FFFFFF" strokeWidth="12" />
        <line x1="310" y1="0" x2="310" y2="280" stroke="#E2E8F0" strokeWidth="10" />

        {/* Active Route Polyline: Road 36 -> Checkpost -> ORR -> School */}
        <path
          d="M 50 160 Q 90 140 140 140 T 230 100 T 330 60"
          fill="none"
          stroke="#006B2F"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Directional dashes on route */}
        <path
          d="M 50 160 Q 90 140 140 140 T 230 100 T 330 60"
          fill="none"
          stroke="#86EFAC"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />

        {/* Stop 1: Home Pickup Pin */}
        <g transform="translate(50, 160)">
          <circle r="7" fill="#0F172A" />
          <circle r="3" fill="#FFFFFF" />
          <text x="12" y="4" fontSize="10" fontWeight="600" fill="#0F172A" fontFamily="system-ui">
            Home
          </text>
        </g>

        {/* Stop 2: Current / Next Pickup Pin */}
        <g transform="translate(140, 140)">
          <circle r="6" fill="#D97706" />
          <circle r="2.5" fill="#FFFFFF" />
          <text x="-40" y="-10" fontSize="10" fontWeight="600" fill="#B45309" fontFamily="system-ui">
            {currentStopName}
          </text>
        </g>

        {/* Destination: School Pin */}
        <g transform="translate(330, 60)">
          <circle r="12" fill="#006B2F" />
          <path d="M -5 -2 L 0 -7 L 5 -2 L 5 5 L -5 5 Z" fill="#FFFFFF" />
          <text x="-40" y="-16" fontSize="10" fontWeight="700" fill="#006B2F" fontFamily="system-ui">
            {schoolName}
          </text>
        </g>

        {/* Live Vehicle Marker */}
        <g transform="translate(185, 118)">
          {/* Animated pulse halo */}
          {isVehicleMoving && (
            <circle r="18" fill="#006B2F" opacity="0.2">
              <animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Vehicle Puck */}
          <circle r="13" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* Rickshaw / Cab Icon */}
          <path
            d="M -5 -3 L 5 -3 L 4 4 L -4 4 Z"
            fill="#FEA707"
          />
          <circle cx="-3" cy="4" r="1.5" fill="#FFFFFF" />
          <circle cx="3" cy="4" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Floating Status Pill (Top Left) */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          backgroundColor: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: RADIUS_TOKENS.sm,
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #E2E8F0',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#006B2F',
            display: 'inline-block',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Live Tracking
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
            {routeTitle}
          </span>
        </div>
      </div>

      {/* Floating ETA Badge (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          backgroundColor: '#006B2F',
          color: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: RADIUS_TOKENS.sm,
          boxShadow: '0 2px 6px rgba(0, 107, 47, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>
          {vehicleEta}
        </span>
      </div>

      {/* Bottom overlay info bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'none',
          padding: '8px 14px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#475569',
        }}
      >
        <div>
          Vehicle: <strong style={{ color: '#0F172A' }}>{vehicleNumber}</strong> • Next: <strong style={{ color: '#0F172A' }}>{currentStopName}</strong>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            style={{
              background: 'none',
              border: 'none',
              color: '#006B2F',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            Full Map →
          </button>
        )}
      </div>
    </div>
  );
};
