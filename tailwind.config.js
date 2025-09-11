/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',
        panel: '#0f1720',
        accent: '#22d3ee',
        cyan: '#00AEEF',
        magenta: '#EC008C',
        yellow: '#FFF200'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
}
