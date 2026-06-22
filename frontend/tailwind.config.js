/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d2d8c7',
          300: '#b3bda2',
          400: '#94a37d',
          500: '#7a8b64',
          600: '#5f6f4e',
          700: '#4b5840',
          800: '#3e4836',
          900: '#353e2f',
          950: '#1b2118',
        },
        earth: {
          50: '#faf8f5',
          100: '#f2ede5',
          200: '#e3d9cb',
          300: '#d0c0a8',
          400: '#bca483',
          500: '#ad8e69',
          600: '#a07d5b',
          700: '#86664c',
          800: '#6e5343',
          900: '#5c4639',
          950: '#31251d',
        },
        cream: {
          50: '#fefcf9',
          100: '#fdf7ed',
          200: '#f9edd4',
          300: '#f4dfb1',
          400: '#eecc84',
          500: '#e8b75a',
          600: '#e09f3a',
          700: '#c2822e',
          800: '#a1682b',
          900: '#835526',
          950: '#472d12',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}