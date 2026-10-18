/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@palnadu/config/tailwind-preset')],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [],
};
