import React from 'react';
import { RADIUS_TOKENS } from '@tinyride/design-system';

export type NotificationType = 'arrival' | 'boarded' | 'eta' | 'delay' | 'return' | 'general';

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  onPress?: () => void;
  style?: React.CSSProperties;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  type,
  title,
  message,
  timestamp,
  isRead = false,
  onPress,
  style,
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'boarded':
        return {
          bg: '#DCFCE7',
          color: '#006B2F',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ),
        };
      case 'arrival':
        return {
          bg: '#DCFCE7',
          color: '#006B2F',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        };
      case 'eta':
        return {
          bg: '#FEF3C7',
          color: '#B45309',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        };
      case 'delay':
        return {
          bg: '#FFEDD5',
          color: '#C2410C',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case 'return':
      default:
        return {
          bg: '#F1F5F9',
          color: '#475569',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          ),
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <div
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: isRead ? '#FFFFFF' : '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        cursor: onPress ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background-color 0.15s ease',
        ...style,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS_TOKENS.sm,
          backgroundColor: iconConfig.bg,
          color: iconConfig.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {iconConfig.icon}
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: isRead ? 600 : 700, color: '#0F172A' }}>
            {title}
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {timestamp}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#475569', margin: '3px 0 0 0', lineHeight: 1.4 }}>
          {message}
        </p>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <span
          style={{
            position: 'absolute',
            top: '16px',
            right: '12px',
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#006B2F',
          }}
        />
      )}
    </div>
  );
};
