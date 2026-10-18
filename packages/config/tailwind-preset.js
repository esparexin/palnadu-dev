/**
 * ==============================================================================
 * PALNADU.DEV — SHARED TAILWIND PRESET (SSOT)
 * ==============================================================================
 * Included in apps/web and apps/admin tailwind.config.js
 * Inherits all Palnadu brand colors, semantic HSL tokens, and shared design tokens.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Semantic HSL Mappings for Radix / shadcn Compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        // Palnadu Brand Design Tokens
        palnadu: {
          dark: '#042C53',
          'dark-hover': '#12487E',
          blue: '#185FA5',
          teal: '#1D9E75',
          'teal-dark': '#157C5C',
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--conic-position, from 180deg at 50% 50%), var(--tw-gradient-stops))',
        // SSOT: palnadu-teal tint (migrated from cyan rgba(6,182,212,0.15))
        'hero-mesh': 'radial-gradient(circle at 50% 30%, rgba(29, 158, 117, 0.15), transparent 70%)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeOut: {
          '0%, 70%': { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(0.5rem) scale(0.95)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        float: 'float 5s ease-in-out infinite',
        fadeOut: 'fadeOut 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
};
