/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                secondary: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7e22ce',
                    800: '#6b21a8',
                    900: '#581c87',
                },
                accent: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'bounce-slow': 'bounce 2s infinite',
                'shimmer': 'shimmer 4s ease-in-out infinite',
                'aurora': 'aurora 14s ease-in-out infinite',
                'float-slow': 'floatY 18s ease-in-out infinite',
                'float-slow-reverse': 'floatY 22s ease-in-out infinite reverse',
                'popover-in': 'popoverIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                'stagger-fade': 'staggerFade 0.45s ease-out both',
            },
            keyframes: {
                popoverIn: {
                    '0%': { opacity: '0', transform: 'scale(0.94) translateY(-6px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                staggerFade: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                aurora: {
                    '0%, 100%': { opacity: '0.55' },
                    '50%': { opacity: '0.95' },
                },
                floatY: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(8%, -4%) scale(1.02)' },
                    '66%': { transform: 'translate(-6%, 6%) scale(0.98)' },
                },
            },
            transitionProperty: {
                'height': 'height',
                'spacing': 'margin, padding',
            }
        },
    },
    plugins: [],
}