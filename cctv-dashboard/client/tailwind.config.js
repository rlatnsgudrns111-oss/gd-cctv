// client/tailwind.config.js - Tailwind CSS 설정

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f1117',
          card: '#1a1d27',
          border: '#2a2d37',
          hover: '#252836',
        },
        status: {
          online: '#22c55e',
          offline: '#ef4444',
          reconnecting: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
