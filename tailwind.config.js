/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
          200: '#e2e8f0',
          100: '#f1f5f9',
        },
        brand: {
          600: '#6366f1',
          500: '#818cf8',
        },
      },
    },
  },
  plugins: [],
}
