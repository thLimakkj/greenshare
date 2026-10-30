/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontFamily: { sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'] },
    colors: { folha: { 50: '#f1f7f2', 100: '#dcebdf', 600: '#2f6b3f', 700: '#255633', 800: '#1d4430' }, casca: '#f6f3ee', tinta: '#1f2a24' },
  } },
  plugins: [],
}
