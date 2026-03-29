/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: { 900: '#050510', 800: '#0a0a1f', 700: '#0f0f2e', 600: '#151535', 500: '#1a1a45' },
        brand: { 500: '#7c3aed', 400: '#8b5cf6', 300: '#a78bfa', glow: '#6d28d9' },
        accent: { cyan: '#06b6d4', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', orange: '#f97316' }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out'
      },
      keyframes: {
        glow: { from: { boxShadow: '0 0 5px #7c3aed' }, to: { boxShadow: '0 0 20px #7c3aed, 0 0 40px #7c3aed' } },
        slideIn: { from: { transform: 'translateX(-10px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #050510 0%, #0f0f2e 50%, #1a0533 100%)'
      }
    }
  },
  plugins: []
};
