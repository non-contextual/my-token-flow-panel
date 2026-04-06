/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0d0d1a',
        card: '#13131f',
        border: '#1e1e30',
        muted: '#8888aa',
        buy: '#22c55e',
        sell: '#ef4444',
        accent: '#6366f1',
        gold: '#f59e0b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
