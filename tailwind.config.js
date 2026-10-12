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
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'DM Sans', 'sans-serif'],
      },
      colors: {
        // Warm Editorial Sanctuary: Terracotta & Raw Earth Core
        brand: {
          25: '#FDF9F6',
          50: '#FAF3ED',
          100: '#F4E4D8',
          200: '#E9C8B0',
          300: '#DCAB89',
          400: '#CE885F',
          500: '#C25E34', // Signature Terracotta
          600: '#A94F2B',
          700: '#8C3F22',
          800: '#6F321B',
          900: '#572715',
          950: '#33150A',
        },
        // Warm Linen, Tactile Stone & Architectural Charcoal
        gray: {
          25: '#FCFCFA',
          50: '#FBFBF9', // Warm Linen Canvas
          100: '#F4F3EF', // Soft Stone Card Surface
          200: '#EAE8E1', // Tactile Warm Divider / Border
          300: '#DAD6CD',
          400: '#A8A398',
          500: '#78746B',
          600: '#55524B',
          700: '#3A3833',
          800: '#222225',
          900: '#18181B', // Dark Warm Charcoal Surface
          950: '#111113', // Dark Canvas Deep Carbon
        },
        // Botanical Sage & Olive Cleanliness
        success: {
          25: '#F4FAF6',
          50: '#E8F5ED',
          100: '#C7E8D3',
          500: '#2E7D32',
          600: '#256628',
          700: '#1B4D1E',
        },
        // Warm Honey & Sunlit Amber
        warning: {
          25: '#FFFDF5',
          50: '#FEF9E7',
          100: '#FCEEC2',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        },
        // Brick Terracotta Alert Red
        error: {
          25: '#FFF7F5',
          50: '#FEECE7',
          100: '#FCD1C6',
          500: '#D32F2F',
          600: '#B71C1C',
          700: '#8B1212',
        },
        // Preserving iOS aliases for backward compatibility
        ios: {
          bg: {
            light: '#F8F9FC',
            dark: '#0C111D',
          },
          card: {
            light: '#FFFFFF',
            dark: '#161B26',
          },
          cardElevated: {
            light: '#FFFFFF',
            dark: '#1F242F',
          },
          separator: {
            light: '#EAECF0',
            dark: '#1F242F',
          },
          blue: '#007AFF',
          green: '#12B76A',
          orange: '#F79009',
          red: '#F04438',
          purple: '#7F56D9',
          indigo: '#6172F3',
          teal: '#15B79E',
          pink: '#EE46BC',
          yellow: '#FEC84B',
        }
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        'ios': '16px',
        'ios-lg': '20px',
        'ios-xl': '24px',
      },
      boxShadow: {
        'u-xs': '0px 1px 2px rgba(16, 24, 40, 0.05)',
        'u-sm': '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
        'u-md': '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
        'u-lg': '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        'u-xl': '0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)',
        'ios-card': '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        'ios-elevated': '0 10px 15px -3px rgba(16, 24, 40, 0.06), 0 4px 6px -4px rgba(16, 24, 40, 0.04)',
        'ios-sheet': '0 -8px 30px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
