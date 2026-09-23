/**
 * TinyRide Design System — Brand Tokens and Digital Colour System
 * Based on official TinyRide Brand Guidelines by Dodail Solutions.
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
  tinyRideGreen: '#0A9C49', // Primary brand
  tinyRideNavy: '#012646',  // Primary text
  deepBlue: '#022D53',      // Secondary brand
  sunGold: '#FEA707',       // Accent
} as const;

/**
 * Practical website / application UI tokens
 */
export const UI_TOKENS = {
  background: '#FFFFFF',
  surface: '#F4F7F9',
  border: '#D7E1E8',
  textPrimary: '#012646',
  textSecondary: '#526B7F',
  primaryAction: '#067A3A',
  primaryHover: '#055F2E',
  accentSurface: '#FFF4D6',
} as const;

/**
 * 9-step digital colour ramps
 */
export const COLOUR_RAMPS = {
  green: {
    50: '#E8F6EE',
    100: '#CDEBDA',
    200: '#9BD7B5',
    300: '#68C28F',
    400: '#34AE6A',
    500: '#0A9C49',
    600: '#087E3B',
    700: '#06612E',
    800: '#034521',
  },
  navy: {
    50: '#E6EBF0',
    100: '#CDD6DF',
    200: '#9BADBE',
    300: '#6A849E',
    400: '#3A5B7D',
    500: '#022D53',
    600: '#012A4D',
    700: '#012646',
    800: '#011A30',
  },
  gold: {
    50: '#FFF8E6',
    100: '#FFEDBF',
    200: '#FFDB7A',
    300: '#FFC840',
    400: '#FFB71A',
    500: '#FEA707',
    600: '#D98A04',
    700: '#B56E02',
    800: '#6B3D00',
  },
} as const;

/**
 * Semantic status colors matching SQL schema state metadata
 */
export const STATUS_COLOURS = {
  success: '#0A9C49',
  warning: '#FEA707',
  danger: '#F2555A',
  info: '#4F9CF9',
  neutral: '#8B93A8',
  inactive: '#5C647A',
} as const;

/**
 * Severity colors matching public.severities in database
 */
export const SEVERITY_COLOURS = {
  low: { color: '#0A9C49', label: 'Low', slaMinutes: 4320 },
  medium: { color: '#FEA707', label: 'Medium', slaMinutes: 1440 },
  high: { color: '#FF8C42', label: 'High', slaMinutes: 240 },
  critical: { color: '#F2555A', label: 'Critical', slaMinutes: 60 },
} as const;

/**
 * Stitch Design System Tokens (from Stitch project 10974416599197036405)
 */
export const STITCH_THEME = {
  colors: {
    primary: '#006b2f',
    onPrimary: '#ffffff',
    primaryContainer: '#00873d',
    onPrimaryContainer: '#f7fff3',
    primaryFixed: '#81fb9c',
    primaryFixedDim: '#64de82',
    onPrimaryFixed: '#00210a',
    onPrimaryFixedVariant: '#005323',
    primaryAction: '#067A3A',
    primaryHover: '#055F2E',
    
    secondary: '#446083',
    onSecondary: '#ffffff',
    secondaryContainer: '#bad7ff',
    onSecondaryContainer: '#415d80',
    secondaryFixed: '#d2e4ff',
    secondaryFixedDim: '#acc9f1',
    onSecondaryFixed: '#001c37',
    onSecondaryFixedVariant: '#2b486a',
    
    tertiary: '#a5304d',
    onTertiary: '#ffffff',
    tertiaryContainer: '#c64865',
    onTertiaryContainer: '#fffbff',
    tertiaryFixed: '#ffd9dd',
    tertiaryFixedDim: '#ffb2bd',
    onTertiaryFixed: '#400014',
    onTertiaryFixedVariant: '#881839',

    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',

    background: '#FFFFFF',
    onBackground: '#171d17',
    
    surface: '#F4F7F9',
    onSurface: '#171d17',
    surfaceVariant: '#dde5da',
    onSurfaceVariant: '#3e4a3e',
    surfaceDim: '#d5dcd2',
    surfaceBright: '#f4fbf0',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#eff6eb',
    surfaceContainer: '#e9f0e5',
    surfaceContainerHigh: '#e3eae0',
    surfaceContainerHighest: '#dde5da',
    surfaceTint: '#006d30',

    outline: '#6e7a6d',
    outlineVariant: '#bdcaba',

    inverseSurface: '#2b322b',
    inverseOnSurface: '#ecf3e8',
    inversePrimary: '#64de82',

    deepBlue: '#022D53',
    sunGold: '#FEA707',
    border: '#D7E1E8',
    primaryText: '#012646',
    secondaryText: '#526B7F',
    accentSurface: '#FFF4D6',
  },
  typography: {
    fontFamilies: {
      headline: 'Plus Jakarta Sans',
      body: 'Inter',
      label: 'Inter',
    },
  },
  assets: {
    logoUrl: '/brand/logo-horizontal.png',
    logoHorizontal: '/brand/logo-horizontal.png',
    logoWordmark: '/brand/logo-wordmark.png',
    logoStacked: '/brand/logo-stacked.png',
    faviconUrl: '/brand/logo-stacked.png',
  },
} as const;

/**
 * Guidelines usage helper:
 * "Use Navy for body text, Green for primary actions, and Gold as a supporting accent with Navy text."
 */
export const BRAND_USAGE_GUIDELINES = {
  bodyText: UI_TOKENS.textPrimary,
  primaryAction: UI_TOKENS.primaryAction,
  supportingAccent: CORE_COLOURS.sunGold,
} as const;

