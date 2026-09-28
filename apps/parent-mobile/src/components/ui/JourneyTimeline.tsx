import React from 'react';
import { RADIUS_TOKENS } from '@tinyride/design-system';

export interface TimelineStep {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  status: 'completed' | 'active' | 'upcoming';
}

export interface JourneyTimelineProps {
  steps: TimelineStep[];
  style?: React.CSSProperties;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ steps, style }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS_TOKENS.md,
        border: '1px solid #E2E8F0',
        ...style,
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
        Today's Trip Timeline
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
              {/* Timestamp column */}
              <div
                style={{
                  width: '48px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  color: isActive ? '#006B2F' : isCompleted ? '#0F172A' : '#94A3B8',
                  paddingTop: '2px',
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {step.time}
              </div>

              {/* Vertical line and node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: isActive
                      ? '#006B2F'
                      : isCompleted
                      ? '#006B2F'
                      : '#FFFFFF',
                    border: isActive
                      ? '3px solid #DCFCE7'
                      : isCompleted
                      ? '2px solid #006B2F'
                      : '2px solid #CBD5E1',
                    zIndex: 2,
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {!isLast && (
                  <div
                    style={{
                      width: '2px',
                      flexGrow: 1,
                      minHeight: '28px',
                      backgroundColor: isCompleted ? '#86EFAC' : '#E2E8F0',
                      margin: '2px 0',
                    }}
                  />
                )}
              </div>

              {/* Step info */}
              <div style={{ paddingBottom: isLast ? '0' : '18px', flexGrow: 1, paddingTop: '1px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#006B2F' : isCompleted ? '#0F172A' : '#64748B',
                  }}
                >
                  {step.title}
                </div>
                {step.subtitle && (
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {step.subtitle}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
