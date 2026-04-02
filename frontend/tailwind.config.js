/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#CCFBF1',
          100: '#5EEAD4',
          500: '#0D9488',
          600: '#0F766E',
          700: '#0F766E',
        },
        coral: {
          50: '#FFF7ED',
          500: '#F97316',
        },
        blue: {
          50: '#EFF6FF',
          500: '#3B82F6',
        },
        green: {
          50: '#F0FDF4',
          500: '#16A34A',
        },
      },
      fontFamily: {
        'nunito': ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

