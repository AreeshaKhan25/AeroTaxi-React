/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Brand palette carried over from the original AeroTAXI design */
        primary: {
          DEFAULT: '#0C6291',
          50: '#eff8fd',
          100: '#dceffa',
          200: '#b9dff5',
          300: '#86c8ec',
          400: '#4ca9dd',
          500: '#258cc8',
          600: '#176fa9',
          700: '#0C6291',
          800: '#114b6f',
          900: '#13405c',
          950: '#0c293d',
        },
        accent: {
          DEFAULT: '#FACC15',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#FACC15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
        cream: '#F9F6F3',
        lightgreen: '#E3ECE3',
        mintgreen: '#E8F0EB',
        ink: '#111827',
      },
      fontFamily: {
        sans: [
          'Instrument Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.12)',
        'card-hover': '0 2px 4px rgba(16, 24, 40, 0.06), 0 18px 40px -16px rgba(16, 24, 40, 0.22)',
        bar: '0 -4px 20px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-up-bar': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'fade-in-up': 'fade-in-up 300ms ease-out both',
        'slide-down': 'slide-down 150ms ease-out both',
        'slide-up-bar': 'slide-up-bar 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 180ms ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
