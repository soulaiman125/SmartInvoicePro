/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // Tightened tracking on display sizes for a Linear/Stripe feel.
        '2xl': ['1.5rem', { lineHeight: '1.875rem', letterSpacing: '-0.018em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.021em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.024em' }],
      },
      colors: {
        // Primary brand — a refined Stripe/Linear indigo-blue ramp.
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3563e9',
          600: '#2348d4',
          700: '#1d3bb0',
          800: '#1d348f',
          900: '#1d3072',
          950: '#161f47',
        },
        // Secondary accent for gradients / highlights (violet).
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Cool neutral surfaces (replaces flat grays in dark mode).
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0b9c7',
          400: '#8593a6',
          500: '#67768c',
          600: '#525e73',
          700: '#434c5e',
          800: '#2a3140',
          850: '#222734',
          900: '#1a1e29',
          950: '#11141c',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Layered, low-contrast shadows for a premium soft look.
        xs: '0 1px 2px 0 rgb(16 24 40 / 0.05)',
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        'card-hover':
          '0 8px 24px -6px rgb(16 24 40 / 0.12), 0 4px 8px -4px rgb(16 24 40 / 0.06)',
        popover:
          '0 16px 48px -12px rgb(16 24 40 / 0.30), 0 8px 16px -8px rgb(16 24 40 / 0.16)',
        glow: '0 0 0 1px rgb(53 99 233 / 0.30), 0 6px 20px -4px rgb(53 99 233 / 0.45)',
        'glow-sm': '0 4px 14px -4px rgb(53 99 233 / 0.45)',
        'inner-top': 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(rgb(16 24 40 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(16 24 40 / 0.04) 1px, transparent 1px)',
        'brand-gradient': 'linear-gradient(135deg, #3563e9 0%, #7c3aed 100%)',
        'sheen':
          'linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.12) 50%, transparent 70%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
