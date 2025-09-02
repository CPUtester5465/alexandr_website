/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        ground: '#7CFC00',
        sky: '#87CEEB',
        crystal: '#E056FD'
      },
      fontFamily: {
        'comic': ['Comic Sans MS', 'cursive', 'sans-serif']
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #667eea' },
          '100%': { boxShadow: '0 0 20px #764ba2' },
        }
      }
    },
  },
  plugins: [],
}