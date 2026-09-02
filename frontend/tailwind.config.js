/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          primary: '#d4af37',
          light: '#f3e5ab',
          dark: '#997d25',
        },
      },
      fontFamily: {
        'serif-lux': ['Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'],
        'sans': ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
