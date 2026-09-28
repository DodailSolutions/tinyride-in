/**
 * TinyRide Design System — Brand Tokens, Digital Colour System & UI System
 * Official TinyRide Brand Guidelines by Dodail Solutions Private Limited.
 * Tagline: "Little Rides. Big Peace of Mind."
 */

export const BRAND_IDENTITY = {
  name: 'TinyRide',
  company: 'Dodail Solutions Private Limited',
  tagline: 'Little Rides. Big Peace of Mind.',
} as const;

/**
 * Core brand colours
 */
export const CORE_COLOURS = {
  tinyRideGreen: '#006B2F', // Primary brand (accessible WCAG AA/AAA on white)
  tinyRideNavy: '#0F172A',  // Primary text & dark contrast
  deepBlue: '#022D53',      // Secondary brand
  sunGold: '#D97706',       // Accent gold (high contrast)
} as const;

/**
 * 1. Typography Tokens
 * Standard modern sans-serif scale with restrained font sizes and intentional hierarchy.
 */
export const TYPOGRAPHY_TOKENS = {
  fontFamilies: {
    primary: 'Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  scale: {
    display: {
      fontSize: '28px',
      lineHeight: '34px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    h1: {
      fontSize: '22px',
      lineHeight: '28px',
      fontWeight: '700',
      letterSpacing: '-0.015em',
    },
    h2: {
      fontSize: '18px',
      lineHeight: '24px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '15px',
      lineHeight: '20px',
      fontWeight: '600',
      letterSpacing: '-0.005em',
    },
    body: {
      fontSize: '14px',
      lineHeight: '22px',
      fontWeight: '400',
      letterSpacing: '0',
    },
    bodyMedium: {
      fontSize: '14px',
      lineHeight: '22px',
      fontWeight: '500',
      letterSpacing: '0',
    },
    small: {
      fontSize: '13px',
      lineHeight: '18px',
      fontWeight: '400',
      letterSpacing: '0',
    },
    caption: {
      fontSize: '11px',
      lineHeight: '14px',
      fontWeight: '600',
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
    },
    label: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: '500',
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '600',
      letterSpacing: '0.01em',
    },
  },
} as const;

/**
 * 2. Spacing Scale
 * Exact scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
 */
export const SPACING_TOKENS = {
  4: '4px',
  8: '8px',
  12: '12px',
  16: '16px',
  20: '20px',
  24: '24px',
  32: '32px',
  40: '40px',
  48: '48px',
  64: '64px',
} as const;

export const SPACING_NUMERIC = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

/**
 * 3. Border Radius Tokens
 * Moderate corner radii: never excessively rounded or cartoonish.
 */
export const RADIUS_TOKENS = {
  none: '0px',
  sm: '4px',   // Badges, small chips, form helpers
  md: '8px',   // Buttons, inputs, standard cards, list items
  lg: '12px',  // Map panel containers, dialogs, operational widgets
  xl: '16px',  // Maximum radius for bottom sheets and modals
  full: '9999px', // Small indicator pills and circular avatars only
} as const;

/**
 * 4. Shadows Tokens
 * Used sparingly. Hierarchy comes from spacing, borders, and background surfaces.
 */
export const SHADOW_TOKENS = {
  none: 'none',
  subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
  overlay: '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
} as const;

/**
 * 5. Semantic Surface & Border Tokens
 */
export const UI_TOKENS = {
  background: '#FFFFFF',
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceHover: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  primaryAction: '#006B2F',
  primaryHover: '#005524',
  accentSurface: '#FFFBEB',
} as const;

/**
 * 6. Safety & Operational States
 * Multi-factor representation: color + text + icon + context
 */
export const SAFETY_STATE_TOKENS = {
  normal: {
    color: '#006B2F',
    bg: '#DCFCE7',
    border: '#86EFAC',
    label: 'Normal',
    description: 'Vehicle operating on schedule and route.',
  },
  delayed: {
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FCD34D',
    label: 'Delayed',
    description: 'Vehicle delayed due to traffic or weather.',
  },
  attention: {
    color: '#C2410C',
    bg: '#FFEDD5',
    border: '#FDBA74',
    label: 'Requires Attention',
    description: 'Unscheduled stop, detour, or verification mismatch.',
  },
  emergency: {
    color: '#B91C1C',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    label: 'Emergency',
    description: 'Driver SOS triggered or critical incident active.',
  },
  completed: {
    color: '#334155',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    label: 'Completed',
    description: 'Trip finished and child safely handed over.',
  },
} as const;

/**
 * 7. 9-step digital colour ramps
 */
export const COLOUR_RAMPS = {
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#006B2F',
    600: '#005524',
    700: '#00421C',
    800: '#003014',
  },
  navy: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#0F172A',
  },
  gold: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#D97706',
    600: '#B45309',
    700: '#92400E',
    800: '#78350F',
  },
} as const;

/**
 * Semantic status colors matching SQL schema state metadata
 */
export const STATUS_COLOURS = {
  success: '#006B2F',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  neutral: '#64748B',
  inactive: '#94A3B8',
} as const;

/**
 * Severity colors matching public.severities in database
 */
export const SEVERITY_COLOURS = {
  low: { color: '#006B2F', label: 'Low', slaMinutes: 4320 },
  medium: { color: '#D97706', label: 'Medium', slaMinutes: 1440 },
  high: { color: '#EA580C', label: 'High', slaMinutes: 240 },
  critical: { color: '#DC2626', label: 'Critical', slaMinutes: 60 },
} as const;

/**
 * 8. Human UX Writing Guidelines & String Tokens
 * Clean, direct, jargon-free communication for parents, drivers, and schools.
 */
export const UX_STRINGS = {
  status: {
    waiting: 'Waiting for pickup',
    driverEnRoute: 'Driver is on the way',
    approaching: 'Approaching pickup stop',
    boarded: (name: string) => `${name} has boarded`,
    onTheWay: (name: string) => `${name} is en route to school`,
    arrivedAtSchool: (school: string) => `Arrived at ${school}`,
    droppedOff: 'Safely handed over',
  },
  notifications: {
    fiveMinAway: (name: string) => `${name}'s vehicle is 5 minutes away.`,
    childBoarded: (name: string, vehicle: string) => `${name} has boarded vehicle ${vehicle}.`,
    childAtSchool: (name: string, school: string) => `${name} has reached ${school} safely.`,
    delayed: (minutes: number) => `Your vehicle is delayed by approximately ${minutes} minutes.`,
    returnTripStarted: (name: string) => `${name}'s afternoon return trip has started.`,
  },
  emptyStates: {
    noActiveTrip: {
      title: 'No active trip right now',
      message: "Today's scheduled school trip hasn't started yet. You will be notified 15 minutes before pickup.",
    },
    noNotifications: {
      title: 'No new notifications',
      message: 'Trip alerts and safety updates will appear here in real-time.',
    },
    noRosterExceptions: {
      title: 'All students accounted for',
      message: 'No unverified drop-offs or delays reported on this route today.',
    },
  },
  errors: {
    connectionLost: {
      title: 'Unable to update vehicle location',
      message: 'Please check your internet connection. Reconnecting automatically...',
      action: 'Try again',
    },
    otpInvalid: {
      title: 'SafeKey code did not match',
      message: 'Please ask the parent to refresh the SafeKey code in their TinyRide app.',
      action: 'Re-enter SafeKey',
    },
  },
} as const;

/**
 * 9. Stitch & Official Assets Configuration
 */
export const STITCH_THEME = {
  colors: {
    primary: '#006B2F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#00873D',
    onPrimaryContainer: '#F7FFF3',
    primaryFixed: '#81FB9C',
    primaryFixedDim: '#64DE82',
    onPrimaryFixed: '#00210A',
    onPrimaryFixedVariant: '#005323',
    primaryAction: '#006B2F',
    primaryHover: '#005524',
    
    secondary: '#475569',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E2E8F0',
    onSecondaryContainer: '#1E293B',
    
    tertiary: '#991B1B',
    onTertiary: '#FFFFFF',

    error: '#DC2626',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#991B1B',

    background: '#FFFFFF',
    onBackground: '#0F172A',
    
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceSubtle: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    onSurfaceVariant: '#475569',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F8FAFC',
    surfaceContainer: '#F1F5F9',
    surfaceContainerHigh: '#E2E8F0',
    surfaceContainerHighest: '#CBD5E1',

    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',

    deepBlue: '#0F172A',
    sunGold: '#D97706',
    border: '#E2E8F0',
    primaryText: '#0F172A',
    secondaryText: '#475569',
    accentSurface: '#FFFBEB',
  },
  typography: TYPOGRAPHY_TOKENS,
  spacing: SPACING_TOKENS,
  radius: RADIUS_TOKENS,
  shadows: SHADOW_TOKENS,
  assets: {
    logoUrl: '/brand/logo-horizontal.png',
    logoHorizontal: '/brand/logo-horizontal.png',
    logoWordmark: '/brand/logo-wordmark.png',
    logoStacked: '/brand/logo-stacked.png',
    faviconUrl: '/brand/logo-stacked.png',
  },
} as const;

export const BRAND_USAGE_GUIDELINES = {
  bodyText: UI_TOKENS.textPrimary,
  primaryAction: UI_TOKENS.primaryAction,
  supportingAccent: CORE_COLOURS.sunGold,
} as const;
