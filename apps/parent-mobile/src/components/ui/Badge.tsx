import React from 'react';
import { SAFETY_STATE_TOKENS, RADIUS_TOKENS } from '@tinyride/design-system';

export type SafetyStateKey = 'normal' | 'delayed' | 'attention' | 'emergency' | 'completed';

export interface BadgeProps {
  state?: SafetyStateKey;
  label?: string;
  size?: 'sm' | 'md';
  dotOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<BadgeProps> = ({
  state = 'normal',
  label,
  size = 'md',
  dotOnly = false,
  style,
}) => {
  const token = SAFETY_STATE_TOKENS[state] || SAFETY_STATE_TOKENS.normal;
  const displayLabel = label || token.label;

  const renderIcon = () => {
    switch (state) {
      case 'normal':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'delayed':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'attention':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'emergency':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'completed':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
    }
  };

  if (dotOnly) {
    return (
      <span
        role="status"
        aria-label={displayLabel}
        style={{
          display: 'inline-block',
          width: size === 'sm' ? 8 : 10,
          height: size === 'sm' ? 8 : 10,
          borderRadius: RADIUS_TOKENS.full,
          backgroundColor: token.color,
          ...style,
        }}
      />
    );
  }

  return (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: RADIUS_TOKENS.sm,
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        lineHeight: 1.2,
        color: token.color,
        backgroundColor: token.bg,
        border: `1px solid ${token.border}`,
        ...style,
      }}
    >
      {renderIcon()}
      <span>{displayLabel}</span>
    </span>
  );
};
