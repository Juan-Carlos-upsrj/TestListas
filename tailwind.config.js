/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        'iaev-background': '#F8F6F1',
        'iaev-surface': '#FFFFFF',
        'iaev-blue': {
            light: '#A5C9FF',
            DEFAULT: '#448AFF',
            dark: '#303F9F',
            darker: '#1A237E'
        },
        'iaev-yellow': {
            light: '#FFF59D',
            DEFAULT: '#FBC02D',
            dark: '#F9A825'
        },
        'iaev-red': {
            light: '#FFCDD2',
            DEFAULT: '#E57373',
            dark: '#D32F2F'
        },
        'iaev-green': {
            light: '#DCEDC8',
            DEFAULT: '#AED581',
            dark: '#689F38'
        },
        'iaev-teal': {
            light: '#B2DFDB',
            DEFAULT: '#80CBC4',
            dark: '#00796B'
        },
        'iaev-text': {
            primary: '#2C3E50',
            secondary: '#78909C'
        },
      },
      animation: {
        'gradient-x': 'gradient-x 5s ease infinite',
        'float': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-25px)' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      }
    },
  },
  plugins: [],
}