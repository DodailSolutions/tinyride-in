/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#006b2f',
        'on-primary': '#ffffff',
        'primary-container': '#00873d',
        'on-primary-container': '#f7fff3',
        'primary-fixed': '#81fb9c',
        'primary-fixed-dim': '#64de82',
        'on-primary-fixed': '#00210a',
        'on-primary-fixed-variant': '#005323',
        'primary-action': '#067A3A',
        'primary-hover': '#055F2E',

        'secondary': '#446083',
        'on-secondary': '#ffffff',
        'secondary-container': '#bad7ff',
        'on-secondary-container': '#415d80',
        'secondary-fixed': '#d2e4ff',
        'secondary-fixed-dim': '#acc9f1',
        'on-secondary-fixed': '#001c37',
        'on-secondary-fixed-variant': '#2b486a',

        'tertiary': '#a5304d',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#c64865',
        'on-tertiary-container': '#fffbff',
        'tertiary-fixed': '#ffd9dd',
        'tertiary-fixed-dim': '#ffb2bd',
        'on-tertiary-fixed': '#400014',
        'on-tertiary-fixed-variant': '#881839',

        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        'background': '#FFFFFF',
        'on-background': '#171d17',

        'surface': '#F4F7F9',
        'on-surface': '#171d17',
        'surface-variant': '#dde5da',
        'on-surface-variant': '#3e4a3e',
        'surface-dim': '#d5dcd2',
        'surface-bright': '#f4fbf0',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff6eb',
        'surface-container': '#e9f0e5',
        'surface-container-high': '#e3eae0',
        'surface-container-highest': '#dde5da',
        'surface-tint': '#006d30',

        'outline': '#6e7a6d',
        'outline-variant': '#bdcaba',

        'inverse-surface': '#2b322b',
        'inverse-on-surface': '#ecf3e8',
        'inverse-primary': '#64de82',

        'deep-blue': '#022D53',
        'sun-gold': '#FEA707',
        'border': '#D7E1E8',
        'primary-text': '#012646',
        'secondary-text': '#526B7F',
        'accent-surface': '#FFF4D6',
        
        tinyride: {
          green: '#0A9C49',
          navy: '#012646',
          deepblue: '#022D53',
          gold: '#FEA707',
          surface: '#F4F7F9',
          border: '#D7E1E8',
          textPrimary: '#012646',
          textSecondary: '#526B7F',
          primaryAction: '#067A3A',
        },
      },
      fontFamily: {
        headline: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      spacing: {
        'margin': '1.5rem',
        'gutter': '1.5rem',
      },
    },
  },
  plugins: [],
};
