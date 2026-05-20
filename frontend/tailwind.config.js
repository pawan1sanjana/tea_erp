/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode manually
  theme: {
    extend: {
      colors: {
        tea: {
          50: '#f2fcf5',
          100: '#e1f8e8',
          200: '#c4efd3',
          300: '#95e0b3',
          400: '#5fc98d',
          500: '#38ad6c', // Primary Emerald/Green
          600: '#278b54',
          700: '#226f45',
          800: '#1f5839',
          900: '#1a4930',
          950: '#0e291b', // Deep Botanical
        },
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617', // High Contrast background
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
