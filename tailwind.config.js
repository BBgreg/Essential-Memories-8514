/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF6E3',
        'pastel-pink': '#FFB3D9',
        'pastel-teal': '#A8E6CF',
        'pastel-yellow': '#FFE066',
        'pastel-purple': '#D4A5FF',
        'pastel-coral': '#FFB3A7',
        'pastel-green': '#BDEBC9',
        'vibrant-pink': '#FF6B9D',
        'vibrant-teal': '#4ECDC4',
        'vibrant-yellow': '#FFD93D',
        'vibrant-purple': '#A8E6CF',
        'vibrant-green': '#6BCB77',
        'soft-gray': '#F8F9FA',
        'text-primary': '#2D3748',
        'text-secondary': '#4A5568',
      },
      fontFamily: {
        'rounded': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'confetti': 'confetti 2s ease-out',
        'bounce-gentle': 'bounce-gentle 1s ease-in-out',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        'bounce-gentle': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}