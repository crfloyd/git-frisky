/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        border: 'hsl(var(--color-border-base))',
        input: 'hsl(var(--color-border-base))',
        ring: 'hsl(var(--color-border-focus))',
        background: 'hsl(var(--color-bg-base))',
        foreground: 'hsl(var(--color-text-primary))',
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          foreground: 'hsl(var(--color-text-primary))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-bg-elevated))',
          foreground: 'hsl(var(--color-text-secondary))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-danger))',
          foreground: 'hsl(var(--color-text-primary))',
        },
        muted: {
          DEFAULT: 'hsl(var(--color-bg-hover))',
          foreground: 'hsl(var(--color-text-tertiary))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-bg-hover))',
          foreground: 'hsl(var(--color-text-primary))',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-bg-elevated))',
          foreground: 'hsl(var(--color-text-primary))',
        },
        card: {
          DEFAULT: 'hsl(var(--color-bg-elevated))',
          foreground: 'hsl(var(--color-text-primary))',
        },
      },
      fontFamily: {
        sans: 'var(--font-ui)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        md: ['14px', '22px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
      },
    },
  },
  plugins: [],
}
