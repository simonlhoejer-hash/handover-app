/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {

        nordic: {
          green: '#3f7f7a',
          greenDark: '#0f4f4a',
          greenLight: '#e6f2f1',
        },

        ui: {
          background: '#f3f5f6',
          card: '#ffffff',
          gray: '#6b7280',
        }

      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}