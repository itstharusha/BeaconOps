/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#EFF4FF',
                    100: '#D9E5FF',
                    200: '#BCD0FF',
                    300: '#8EB2FF',
                    400: '#5B8DEF',
                    500: '#2563EB',
                    600: '#1D4FCC',
                    700: '#163DA6',
                    800: '#12307F',
                    900: '#0E2463',
                },
                surface: {
                    0: '#FFFFFF',
                    50: '#F8F9FB',
                    100: '#F1F3F7',
                    200: '#E2E5EB',
                    300: '#C9CDD8',
                    800: '#222633',
                    850: '#1C1F2B',
                    900: '#181B25',
                    950: '#0F1117',
                },
                risk: {
                    critical: '#DC2626',
                    'critical-light': '#FEE2E2',
                    'critical-dark': '#EF4444',
                    high: '#EA580C',
                    'high-light': '#FFF7ED',
                    'high-dark': '#F97316',
                    medium: '#CA8A04',
                    'medium-light': '#FEFCE8',
                    'medium-dark': '#EAB308',
                    low: '#16A34A',
                    'low-light': '#F0FDF4',
                    'low-dark': '#22C55E',
                },
                ink: {
                    900: '#1A1D27',
                    700: '#3D4155',
                    500: '#6B7085',
                    300: '#8B90A5',
                    200: '#A8ACBD',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
            },
            letterSpacing: {
                tighter: '-0.025em',
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1rem',
            },
            boxShadow: {
                card: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
                'card-hover': '0 4px 12px 0 rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
                modal: '0 20px 60px -12px rgba(0,0,0,0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'counter': 'counter 0.6s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
};
