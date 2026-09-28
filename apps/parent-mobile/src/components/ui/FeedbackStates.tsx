import React from 'react';
import { Button } from './Button';
import { RADIUS_TOKENS } from '@tinyride/design-system';

export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS_TOKENS.md,
        border: '1px solid #E2E8F0',
        ...style,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: RADIUS_TOKENS.full,
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 6px 0' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '300px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
        {message}
      </p>

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  label?: string;
  height?: number | string;
  style?: React.CSSProperties;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading trip updates...',
  height = 140,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS_TOKENS.md,
        border: '1px solid #E2E8F0',
        height,
        gap: '12px',
        ...style,
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          border: '3px solid #E2E8F0',
          borderTopColor: '#006B2F',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: React.CSSProperties;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to update vehicle location',
  message = 'Please check your internet connection or try again in a few moments.',
  onRetry,
  retryLabel = 'Try again',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 18px',
        backgroundColor: '#FEF2F2',
        borderRadius: RADIUS_TOKENS.md,
        border: '1px solid #FCA5A5',
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div style={{ fontSize: '15px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#7F1D1D', maxWidth: '320px', marginBottom: '14px', lineHeight: 1.4 }}>
        {message}
      </div>

      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
