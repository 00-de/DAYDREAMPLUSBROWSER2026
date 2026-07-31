/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dd: {
          bg:      '#0b0f1a',
          bg2:     '#111726',
          panel:   '#141a2b',
          text:    '#e8ecf5',
          muted:   '#8b97ad',
          accent:  '#5b8cff',
          accent2: '#a06bff',
          ok:      '#3ecf8e',
          warn:    '#ffb44d',
          ng:      '#ff5f6d',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Meiryo', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn .4s ease both',
        rise: 'rise .5s cubic-bezier(.22,1,.36,1) both',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
