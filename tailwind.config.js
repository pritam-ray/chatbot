/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'theme-primary': 'rgb(var(--theme-primary) / <alpha-value>)',
        'theme-secondary': 'rgb(var(--theme-secondary) / <alpha-value>)',
        'theme-accent': 'rgb(var(--theme-accent) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
