/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  safelist: [
    // Colores dinámicos usados en strings (Dashboard, Inventory, Products)
    // Text colors
    { pattern: /text-(red|green|blue|purple|yellow|orange|cyan|gray)-(100|200|300|400|500|600|700|800|900)/ },
    // Background colors
    { pattern: /bg-(red|green|blue|purple|yellow|orange|cyan|gray)-(50|100|200|300|400|500|600|700|800|900)/ },
    // Border colors (por si se usan dinámicos)
    { pattern: /border-(red|green|blue|purple|yellow|orange|cyan|gray)-(100|200|300|400|500|600|700|800|900)/ },
  ],
  // Nota: darkMode intencionalmente no activado por pedido del usuario
  theme: {
    extend: {
      // ===== BREAKPOINTS PERSONALIZADOS =====
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Breakpoints específicos para dispositivos
        'mobile': '320px',
        'mobile-lg': '425px',
        'tablet': '768px',
        'tablet-lg': '1024px',
        'laptop': '1366px',
        'laptop-lg': '1440px',
        'desktop': '1920px',
        // Breakpoints para altura
        'h-sm': {'raw': '(max-height: 600px)'},
        'h-md': {'raw': '(max-height: 768px)'},
        'h-lg': {'raw': '(max-height: 900px)'},
        // Breakpoints para orientación
        'portrait': {'raw': '(orientation: portrait)'},
        'landscape': {'raw': '(orientation: landscape)'},
        // Breakpoints para densidad de píxeles
        'retina': {'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'},
        // Breakpoints para preferencias del usuario
        'motion-reduce': {'raw': '(prefers-reduced-motion: reduce)'},
        'dark': {'raw': '(prefers-color-scheme: dark)'},
        'high-contrast': {'raw': '(prefers-contrast: high)'},
      },

      // ===== COLORES PERSONALIZADOS =====
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },

      // ===== TIPOGRAFÍA RESPONSIVE =====
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        // Tamaños responsive personalizados
        'responsive-xs': ['clamp(0.75rem, 1vw, 0.875rem)', { lineHeight: '1.25rem' }],
        'responsive-sm': ['clamp(0.875rem, 1.25vw, 1rem)', { lineHeight: '1.5rem' }],
        'responsive-base': ['clamp(1rem, 1.5vw, 1.125rem)', { lineHeight: '1.75rem' }],
        'responsive-lg': ['clamp(1.125rem, 2vw, 1.25rem)', { lineHeight: '1.75rem' }],
        'responsive-xl': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '2rem' }],
        'responsive-2xl': ['clamp(1.5rem, 3vw, 1.875rem)', { lineHeight: '2.25rem' }],
        'responsive-3xl': ['clamp(1.875rem, 4vw, 2.25rem)', { lineHeight: '2.5rem' }],
        'responsive-4xl': ['clamp(2.25rem, 5vw, 3rem)', { lineHeight: '1' }],
        'responsive-5xl': ['clamp(3rem, 6vw, 3.75rem)', { lineHeight: '1' }],
      },

      // ===== ESPACIADO RESPONSIVE =====
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        // Espaciado responsive
        'responsive-1': 'clamp(0.25rem, 1vw, 0.5rem)',
        'responsive-2': 'clamp(0.5rem, 1.5vw, 1rem)',
        'responsive-3': 'clamp(0.75rem, 2vw, 1.5rem)',
        'responsive-4': 'clamp(1rem, 2.5vw, 2rem)',
        'responsive-6': 'clamp(1.5rem, 3vw, 3rem)',
        'responsive-8': 'clamp(2rem, 4vw, 4rem)',
        'responsive-12': 'clamp(3rem, 6vw, 6rem)',
        'responsive-16': 'clamp(4rem, 8vw, 8rem)',
      },

      // ===== BORDES Y RADIOS =====
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },

      // ===== SOMBRAS PERSONALIZADAS =====
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-lg': '0 0 40px rgba(249, 115, 22, 0.4)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-medium': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
      },

      // ===== ANIMACIONES PERSONALIZADAS =====
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },

      // ===== TRANSICIONES PERSONALIZADAS =====
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1000': '1000ms',
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'ease-in-quart': 'cubic-bezier(0.5, 0, 0.75, 0)',
      },

      // ===== GRADIENTES PERSONALIZADOS =====
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
        'gradient-success': 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        'gradient-error': 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },

      // ===== FILTROS PERSONALIZADOS =====
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },

      // ===== Z-INDEX PERSONALIZADO =====
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // ===== ASPECT RATIO PERSONALIZADO =====
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
        '16/9': '16 / 9',
        '21/9': '21 / 9',
      },

      // ===== GRID TEMPLATE COLUMNS RESPONSIVE =====
      gridTemplateColumns: {
        'auto-fit-200': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-250': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-300': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fit-350': 'repeat(auto-fit, minmax(350px, 1fr))',
        'auto-fit-400': 'repeat(auto-fit, minmax(400px, 1fr))',
        'auto-fill-200': 'repeat(auto-fill, minmax(200px, 1fr))',
        'auto-fill-250': 'repeat(auto-fill, minmax(250px, 1fr))',
        'auto-fill-300': 'repeat(auto-fill, minmax(300px, 1fr))',
      },

      // ===== MIN HEIGHT RESPONSIVE =====
      minHeight: {
        'screen-75': '75vh',
        'screen-50': '50vh',
        'screen-25': '25vh',
        'responsive-screen': 'clamp(400px, 50vh, 600px)',
      },

      // ===== MAX WIDTH RESPONSIVE =====
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        'responsive-sm': 'clamp(300px, 90vw, 640px)',
        'responsive-md': 'clamp(640px, 90vw, 768px)',
        'responsive-lg': 'clamp(768px, 90vw, 1024px)',
        'responsive-xl': 'clamp(1024px, 90vw, 1280px)',
        'responsive-2xl': 'clamp(1280px, 90vw, 1536px)',
      },

      // ===== FONT FAMILY PERSONALIZADA =====
      fontFamily: {
        'sans': [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        'mono': [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },

      // ===== LINE HEIGHT RESPONSIVE =====
      lineHeight: {
        'extra-tight': '1.1',
        'extra-loose': '2.5',
        'responsive-tight': 'clamp(1.1, 1.2, 1.3)',
        'responsive-normal': 'clamp(1.4, 1.5, 1.6)',
        'responsive-loose': 'clamp(1.7, 1.8, 1.9)',
      },

      // ===== LETTER SPACING PERSONALIZADO =====
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },

      // ===== OPACITY PERSONALIZADA =====
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },

      // ===== SCALE PERSONALIZADO =====
      scale: {
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
        '105': '1.05',
        '106': '1.06',
        '107': '1.07',
        '108': '1.08',
        '109': '1.09',
        '110': '1.1',
      },

      // ===== ROTATE PERSONALIZADO =====
      rotate: {
        '1': '1deg',
        '2': '2deg',
        '3': '3deg',
        '6': '6deg',
        '12': '12deg',
        '15': '15deg',
        '30': '30deg',
        '60': '60deg',
        '90': '90deg',
        '180': '180deg',
      },

      // ===== SKEW PERSONALIZADO =====
      skew: {
        '1': '1deg',
        '2': '2deg',
        '3': '3deg',
        '6': '6deg',
        '12': '12deg',
      },

      // ===== TRANSLATE PERSONALIZADO =====
      translate: {
        '1/7': '14.285714%',
        '2/7': '28.571429%',
        '3/7': '42.857143%',
        '4/7': '57.142857%',
        '5/7': '71.428571%',
        '6/7': '85.714286%',
        '1/8': '12.5%',
        '2/8': '25%',
        '3/8': '37.5%',
        '4/8': '50%',
        '5/8': '62.5%',
        '6/8': '75%',
        '7/8': '87.5%',
      },

      // ===== BLUR PERSONALIZADO =====
      blur: {
        '4xl': '72px',
        '5xl': '96px',
      },

      // ===== BRIGHTNESS PERSONALIZADO =====
      brightness: {
        '25': '.25',
        '40': '.4',
        '50': '.5',
        '60': '.6',
        '75': '.75',
        '90': '.9',
        '110': '1.1',
        '125': '1.25',
        '150': '1.5',
        '175': '1.75',
        '200': '2',
      },

      // ===== CONTRAST PERSONALIZADO =====
      contrast: {
        '0': '0',
        '50': '.5',
        '75': '.75',
        '100': '1',
        '125': '1.25',
        '150': '1.5',
        '200': '2',
      },

      // ===== GRAYSCALE PERSONALIZADO =====
      grayscale: {
        '0': '0',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '100': '1',
      },

      // ===== HUE ROTATE PERSONALIZADO =====
      hueRotate: {
        '-180': '-180deg',
        '-90': '-90deg',
        '-60': '-60deg',
        '-30': '-30deg',
        '-15': '-15deg',
        '0': '0deg',
        '15': '15deg',
        '30': '30deg',
        '60': '60deg',
        '90': '90deg',
        '180': '180deg',
      },

      // ===== INVERT PERSONALIZADO =====
      invert: {
        '0': '0',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '100': '1',
      },

      // ===== SATURATE PERSONALIZADO =====
      saturate: {
        '0': '0',
        '50': '.5',
        '100': '1',
        '150': '1.5',
        '200': '2',
      },

      // ===== SEPIA PERSONALIZADO =====
      sepia: {
        '0': '0',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '100': '1',
      },

      // ===== DROP SHADOW PERSONALIZADO =====
      dropShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-lg': '0 0 40px rgba(249, 115, 22, 0.4)',
      },
    },
  },
  plugins: [
    // Plugin para utilidades responsive personalizadas
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-responsive': {
          fontSize: 'clamp(0.875rem, 1vw, 1rem)',
          lineHeight: '1.5',
        },
        '.text-responsive-lg': {
          fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
          lineHeight: '1.6',
        },
        '.text-responsive-xl': {
          fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
          lineHeight: '1.5',
        },
        '.text-responsive-2xl': {
          fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
          lineHeight: '1.4',
        },
        '.text-responsive-3xl': {
          fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
          lineHeight: '1.3',
        },
        '.text-responsive-4xl': {
          fontSize: 'clamp(1.875rem, 4vw, 2.25rem)',
          lineHeight: '1.2',
        },
        '.text-responsive-5xl': {
          fontSize: 'clamp(2.25rem, 5vw, 3rem)',
          lineHeight: '1.1',
        },
        '.p-responsive': {
          padding: 'clamp(0.5rem, 2vw, 1rem)',
        },
        '.p-responsive-lg': {
          padding: 'clamp(1rem, 3vw, 1.5rem)',
        },
        '.p-responsive-xl': {
          padding: 'clamp(1.5rem, 4vw, 2rem)',
        },
        '.m-responsive': {
          margin: 'clamp(0.5rem, 2vw, 1rem)',
        },
        '.m-responsive-lg': {
          margin: 'clamp(1rem, 3vw, 1.5rem)',
        },
        '.m-responsive-xl': {
          margin: 'clamp(1.5rem, 4vw, 2rem)',
        },
        '.gap-responsive': {
          gap: 'clamp(0.5rem, 2vw, 1rem)',
        },
        '.gap-responsive-lg': {
          gap: 'clamp(1rem, 3vw, 1.5rem)',
        },
        '.gap-responsive-xl': {
          gap: 'clamp(1.5rem, 4vw, 2rem)',
        },
        '.rounded-responsive': {
          borderRadius: 'clamp(0.25rem, 1vw, 0.5rem)',
        },
        '.rounded-responsive-lg': {
          borderRadius: 'clamp(0.5rem, 1.5vw, 1rem)',
        },
        '.rounded-responsive-xl': {
          borderRadius: 'clamp(1rem, 2vw, 1.5rem)',
        },
        '.shadow-responsive': {
          boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        },
        '.shadow-responsive-lg': {
          boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        '.shadow-responsive-xl': {
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        },
        '.backdrop-blur-responsive': {
          backdropFilter: 'blur(clamp(4px, 1vw, 8px))',
        },
        '.backdrop-blur-responsive-lg': {
          backdropFilter: 'blur(clamp(8px, 2vw, 16px))',
        },
        '.backdrop-blur-responsive-xl': {
          backdropFilter: 'blur(clamp(16px, 3vw, 24px))',
        },
      }
      addUtilities(newUtilities)
    },
  ],
} 