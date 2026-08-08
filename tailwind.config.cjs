/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dd: {
          bg:      '#0b0f1a',
          bg2:     '#111726',
          panel:   'rgb(var(--dd-panel-rgb) / <alpha-value>)',
          text:    'var(--dd-text)',
          muted:   'var(--dd-muted)',
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
        slide: 'slide 1.1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
    },
  },
  plugins: [],
};
