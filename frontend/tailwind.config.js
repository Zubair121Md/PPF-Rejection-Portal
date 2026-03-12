/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f4f2ff',
          100: '#e4deff',
          500: '#7c3aed',
          600: '#6d28d9',
        },
      },
    },
  },
  plugins: [],
};

