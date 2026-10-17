/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Neo-SaaS & Fintech Sleek: Electric Indigo & Ultraviolet Core
        brand: {
          25: '#F8FAFF',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Electric Indigo Primary
          600: '#4F46E5', // Deep Ultraviolet Indigo
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        // Crisp Architectural Slate & Deep Obsidian Carbon
        gray: {
          25: '#FCFDFF',
          50: '#F8FAFC',  // Light Crisp Slate Canvas
          100: '#F1F5F9', // Soft Slate Surface
          200: '#E2E8F0', // Crisp Hairline Border
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E2235', // Dark Slate Hairline Border
          900: '#11131F', // Dark Elevated Obsidian Card
          950: '#090A0F', // Deep Obsidian Canvas
        },
        // Neon Emerald Mint
        success: {
          25: '#F0FDF9',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        // Electric Amber
        warning: {
          25: '#FFFBEB',
          50: '#FEF3C7',
          100: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        // Crimson Rose Alert
        error: {
          25: '#FFF1F2',
          50: '#FFE4E6',
          100: '#FECDD3',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        },
        // Preserving iOS aliases for backward compatibility
        ios: {
          bg: {
            light: '#F8FAFC',
            dark: '#090A0F',
          },
          card: {
            light: '#FFFFFF',
            dark: '#11131F',
          },
          cardElevated: {
            light: '#FFFFFF',
            dark: '#171A2B',
          },
          separator: {
            light: '#E2E8F0',
            dark: '#1E2235',
          },
          blue: '#6366F1',
          green: '#10B981',
          orange: '#F59E0B',
          red: '#F43F5E',
          purple: '#8B5CF6',
          indigo: '#6366F1',
          teal: '#06B6D4',
          pink: '#EC4899',
          yellow: '#FACC15',
        }
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '30px',
        'ios': '18px',
        'ios-lg': '22px',
        'ios-xl': '28px',
      },
      boxShadow: {
        'u-xs': '0px 1px 2px rgba(15, 23, 42, 0.04), inset 0px 1px 0px rgba(255, 255, 255, 0.6)',
        'u-sm': '0px 2px 6px -1px rgba(15, 23, 42, 0.06), 0px 1px 2px -1px rgba(15, 23, 42, 0.04), inset 0px 1px 0px rgba(255, 255, 255, 0.7)',
        'u-md': '0px 8px 20px -4px rgba(15, 23, 42, 0.08), 0px 2px 6px -2px rgba(15, 23, 42, 0.04), inset 0px 1px 0px rgba(255, 255, 255, 0.7)',
        'u-lg': '0px 16px 32px -6px rgba(15, 23, 42, 0.12), 0px 4px 10px -2px rgba(15, 23, 42, 0.04), inset 0px 1px 0px rgba(255, 255, 255, 0.5)',
        'u-xl': '0px 24px 48px -12px rgba(15, 23, 42, 0.18), 0px 8px 16px -4px rgba(15, 23, 42, 0.06)',
        'u-glow': '0px 6px 20px -3px rgba(99, 102, 241, 0.42), 0px 2px 6px -1px rgba(124, 58, 237, 0.25), inset 0px 1px 0px rgba(255, 255, 255, 0.35)',
        'u-glow-lg': '0px 10px 32px -4px rgba(99, 102, 241, 0.55), 0px 4px 14px -2px rgba(139, 92, 246, 0.35), inset 0px 1px 0px rgba(255, 255, 255, 0.4)',
        'u-card-hover': '0px 14px 32px -8px rgba(99, 102, 241, 0.15), 0px 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'ios-card': '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        'ios-elevated': '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.04)',
        'ios-sheet': '0 20px 50px rgba(0, 0, 0, 0.35)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
}
