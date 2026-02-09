/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mafia: {
          bg: '#0d0a08',
          surface: '#1a1512',
          card: '#252019',
          border: '#3d3229',
          'border-light': '#4a3f35',
          gold: '#c9a227',
          'gold-light': '#e8d48b',
          'gold-dim': '#8b7340',
          red: '#8b2e2e',
          'red-light': '#b54a4a',
          cream: '#e8e4df',
          muted: '#a89f94',
          success: '#2d5a2d',
          'success-light': '#3d7a3d',
          /* Day mode (light) */
          'day-bg': '#f2ede5',
          'day-surface': '#e8e2d9',
          'day-card': '#fffef9',
          'day-border': '#c4b8a8',
          'day-text': '#2c2825',
          'day-muted': '#5c534a',
          'day-gold': '#8b6919',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
      },
      boxShadow: {
        'mafia': '0 4px 14px rgba(0,0,0,0.4)',
        'mafia-gold': '0 0 20px rgba(201, 162, 39, 0.15)',
        'mafia-inner': 'inset 0 1px 0 rgba(201, 162, 39, 0.08)',
      },
      borderWidth: {
        'mafia': '2px',
      },
      accentColor: {
        'mafia-gold': '#c9a227',
      },
    },
  },
  plugins: [],
}
