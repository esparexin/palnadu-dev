/**
 * ==============================================================================
 * PALNADU.DEV — SHARED TAILWIND PRESET (SSOT)
 * ==============================================================================
 * Included in apps/web and apps/admin tailwind.config.js
 * Inherits all Palnadu brand colors and shared design tokens.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        palnadu: {
          dark: '#042C53',
          blue: '#185FA5',
          teal: '#1D9E75',
          'light-blue': '#E6F1FB',
          'off-white': '#F1EFE8',
          white: '#FFFFFF',
          body: '#5F5E5A',
          secondary: '#888780',
          border: '#D3D1C7',
          success: '#1D9E75',
          error: '#D84040',
          warning: '#F59E0B',
          info: '#185FA5',
        },
        brand: {
          dark: '#042C53',
          primary: '#185FA5',
          accent: '#1D9E75',
          surface: '#F1EFE8',
          highlight: '#E6F1FB',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--conic-position, from 180deg at 50% 50%), var(--tw-gradient-stops))',
      },
    },
  },
};
