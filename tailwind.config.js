/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./*.html', './src/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        forest: token('forest'),
        primary: { DEFAULT: token('primary'), dark: token('primary-dark'), soft: token('primary-soft') },
        accent: { DEFAULT: token('accent'), strong: token('accent-strong'), soft: token('accent-soft'), ink: token('accent-ink') },
        lime: token('lime'),
        timer: token('timer'),
        sand: '#EFF2F1',
        line: { DEFAULT: '#DDE3E0', soft: '#ECEEF1' },
        ink: { DEFAULT: '#121417', body: '#4B5563', muted: '#5E6B64' },
        mist: '#F3F4F6',
      },
      fontFamily: {
        sans: ['"Readex Pro"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '1320px',
      },
      borderRadius: {
        card: '18px',
        hero: '26px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(6,46,34,.04), 0 8px 24px -12px rgba(6,46,34,.14)',
        header: '0 6px 20px -14px rgba(6,46,34,.25)',
        float: '0 1px 4px rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
};
