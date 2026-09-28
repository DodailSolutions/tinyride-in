import React from 'react';
import { CORE_COLOURS, RADIUS_TOKENS, SHADOW_TOKENS } from '@tinyride/design-system';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#94A3B8' : CORE_COLOURS.tinyRideGreen,
          color: '#FFFFFF',
          border: '1px solid transparent',
        };
      case 'secondary':
        return {
          backgroundColor: '#F1F5F9',
          color: '#0F172A',
          border: '1px solid #E2E8F0',
        };
      case 'outline':
        return {
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          border: '1px solid #CBD5E1',
        };
      case 'danger':
        return {
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          border: '1px solid transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#475569',
          border: '1px solid transparent',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          height: '32px',
          padding: '0 12px',
          fontSize: '12px',
          fontWeight: 600,
        };
      case 'md':
        return {
          height: '42px',
          padding: '0 16px',
          fontSize: '14px',
          fontWeight: 600,
        };
      case 'lg':
        return {
          height: '50px',
          padding: '0 20px',
          fontSize: '15px',
          fontWeight: 600,
        };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        borderRadius: RADIUS_TOKENS.md,
        boxShadow: variant === 'ghost' ? 'none' : SHADOW_TOKENS.subtle,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease-in-out',
        fontFamily: 'inherit',
        textDecoration: 'none',
        lineHeight: 1,
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: 16,
            height: 16,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#FFFFFF',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
