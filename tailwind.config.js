/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilitar estrategia de clase para el modo oscuro
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        // --- Tema Claro (IAEV 2.0) - Predeterminado ---
        'background': 'var(--color-background, #FDFCF5)',
        'surface': 'var(--color-surface, #FFFFFF)',
        'surface-secondary': 'var(--color-surface-secondary, #F1F5F9)', // slate-100
        'primary': 'var(--color-primary, #3F5D7D)', // iaev-blue-dark
        'primary-hover': 'var(--color-primary-hover, #34495E)',
        'primary-text': 'var(--color-primary-text, #FFFFFF)',
        'text-primary': 'var(--color-text-primary, #34495E)',
        'text-secondary': 'var(--color-text-secondary, #78909C)',
        'border-color': 'var(--color-border-color, #E2E8F0)', // slate-200
        'accent-red': '#D36C6C',
        'accent-red-light': '#FFCDD2',
        'accent-green': '#B4D3B8',
        'accent-green-dark': '#689F38',
        'accent-yellow': '#E6B94E',
        'accent-yellow-dark': '#F9A825',
        'accent-blue': '#4A6E94',
        'accent-teal': '#80CBC4',
        
        // --- Tema Oscuro ---
        'dark-background': 'var(--color-background, #1A202C)',
        'dark-surface': 'var(--color-surface, #2D3748)',
        'dark-surface-secondary': 'var(--color-surface-secondary, #4A5568)', // gray-700
        'dark-primary': 'var(--color-primary, #60A5FA)', // blue-400
        'dark-primary-hover': 'var(--color-primary-hover, #93C5FD)', // blue-300
        'dark-primary-text': 'var(--color-primary-text, #1A202C)',
        'dark-text-primary': 'var(--color-text-primary, #F7FAFC)',
        'dark-text-secondary': 'var(--color-text-secondary, #A0AEC0)',
        'dark-border-color': 'var(--color-border-color, #4A5568)', // gray-700
        'dark-accent-red': '#E57373',
        'dark-accent-red-light': '#D32F2F',
        'dark-accent-green': '#81C784',
        'dark-accent-green-dark': '#AED581',
        'dark-accent-yellow': '#FFD54F',
        'dark-accent-yellow-dark': '#FBC02D',
        'dark-accent-blue': '#90CDF4',
        'dark-accent-teal': '#4FD1C5',
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
