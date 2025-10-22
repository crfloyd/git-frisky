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
      // Define colors properly for Tailwind utilities
      backgroundColor: {
        base: 'hsl(var(--color-bg-base))',
        elevated: 'hsl(var(--color-bg-elevated))',
        overlay: 'hsl(var(--color-bg-overlay))',
        hover: 'hsl(var(--color-bg-hover))',
        active: 'hsl(var(--color-bg-active))',
        subtle: 'hsl(var(--color-bg-subtle))',
      },
      textColor: {
        primary: 'hsl(var(--color-text-primary))',
        secondary: 'hsl(var(--color-text-secondary))',
        tertiary: 'hsl(var(--color-text-tertiary))',
        disabled: 'hsl(var(--color-text-disabled))',
        added: 'hsl(var(--color-added))',
        removed: 'hsl(var(--color-removed))',
        modified: 'hsl(var(--color-modified))',
        conflict: 'hsl(var(--color-conflict))',
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        danger: 'hsl(var(--color-danger))',
        info: 'hsl(var(--color-info))',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--color-border-base))',
        base: 'hsl(var(--color-border-base))',
        focus: 'hsl(var(--color-border-focus))',
        strong: 'hsl(var(--color-border-strong))',
      },
      colors: {
        // For other utilities (like divide, ring, etc.)
        border: 'hsl(var(--color-border-base))',
        input: 'hsl(var(--color-border-base))',
        ring: 'hsl(var(--color-border-focus))',
        background: 'hsl(var(--color-bg-base))',
        foreground: 'hsl(var(--color-text-primary))',

        primary: 'hsl(var(--color-primary))',
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        danger: 'hsl(var(--color-danger))',
        info: 'hsl(var(--color-info))',

        added: 'hsl(var(--color-added))',
        'added-bg': 'hsl(var(--color-added-bg))',
        removed: 'hsl(var(--color-removed))',
        'removed-bg': 'hsl(var(--color-removed-bg))',
        modified: 'hsl(var(--color-modified))',
        'modified-bg': 'hsl(var(--color-modified-bg))',
        conflict: 'hsl(var(--color-conflict))',
        'conflict-bg': 'hsl(var(--color-conflict-bg))',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        mono: 'var(--font-mono)',
        sans: 'var(--font-ui)',
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        md: ['14px', '22px'],
        lg: ['16px', '24px'],
        xl: ['20px', '28px'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
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
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
