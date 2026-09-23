import { useState } from 'react';

export interface OtpKeypadProps {
  childName: string;
  leg: 'home_pickup' | 'home_dropoff';
  onVerify: (otp: string) => Promise<boolean> | boolean;
  onCancel: () => void;
}

export function OtpKeypad({ childName, leg, onVerify, onCancel }: OtpKeypadProps) {
  const [digits, setDigits] = useState<string>('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDigit = async (d: string) => {
    if (digits.length >= 6 || isVerifying || attemptsRemaining <= 0) return;
    const next = digits + d;
    setDigits(next);
    setErrorMsg(null);

    // Auto-verify on 6th digit
    if (next.length === 6) {
      setIsVerifying(true);
      try {
        const success = await onVerify(next);
        if (!success) {
          const remaining = attemptsRemaining - 1;
          setAttemptsRemaining(remaining);
          setDigits('');
          if (remaining <= 0) {
            setErrorMsg('SECURITY LOCKOUT: 3 failed attempts. Safety exception automatically raised to Central Ops.');
          } else {
            setErrorMsg(`Invalid OTP. ${remaining} attempt(s) remaining before security lockout.`);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Verification failed');
        setDigits('');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleBackspace = () => {
    if (digits.length > 0 && !isVerifying) {
      setDigits(digits.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    if (!isVerifying) {
      setDigits('');
      setErrorMsg(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#012646',
        borderRadius: 20,
        padding: 24,
        color: '#FFFFFF',
        maxWidth: 380,
        margin: '0 auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 10px',
            borderRadius: 6,
            backgroundColor: '#0A9C49',
            color: '#FFFFFF',
          }}
        >
          {leg === 'home_pickup' ? 'Home Pickup Verification' : 'Home Dropoff Verification'}
        </span>

        <h3 style={{ margin: '12px 0 2px', fontSize: 18, fontWeight: 900, letterSpacing: -0.2 }}>
          {childName}
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
          Ask parent/guardian for 6-digit SafeKey OTP
        </p>
      </div>

      {/* 6 Digit Display Blocks */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const val = digits[idx];
          const isFilled = typeof val !== 'undefined';
          const isCurrent = digits.length === idx;

          return (
            <div
              key={idx}
              style={{
                width: 44,
                height: 52,
                borderRadius: 10,
                border: `2px solid ${isCurrent ? '#FEA707' : isFilled ? '#0A9C49' : '#1E3A8A'}`,
                backgroundColor: '#022D53',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 900,
                fontFamily: 'monospace',
                color: isFilled ? '#FFFFFF' : '#64748B',
              }}
            >
              {isFilled ? val : isCurrent ? '•' : ''}
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#450A0A',
            border: '1px solid #7F1D1D',
            color: '#F87171',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Numeric Keypad Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', '⌫'].map((k) => {
          const isAction = k === 'CLR' || k === '⌫';
          const isLocked = attemptsRemaining <= 0;

          return (
            <button
              key={k}
              disabled={isLocked || isVerifying}
              onClick={() => {
                if (k === 'CLR') handleClear();
                else if (k === '⌫') handleBackspace();
                else handleDigit(k);
              }}
              style={{
                height: 56,
                borderRadius: 12,
                border: 'none',
                backgroundColor: isAction ? '#1E293B' : '#0B3A64',
                color: isAction ? '#94A3B8' : '#FFFFFF',
                fontSize: isAction ? 14 : 22,
                fontWeight: 900,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.4 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.1s',
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: '1px solid #334155',
          backgroundColor: 'transparent',
          color: '#94A3B8',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Cancel Verification
      </button>

      {attemptsRemaining < 3 && attemptsRemaining > 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: '#FEA707', textAlign: 'center' }}>
          ⚠️ Security Lockout Triggered after 3 failed tries.
        </p>
      )}
    </div>
  );
}
