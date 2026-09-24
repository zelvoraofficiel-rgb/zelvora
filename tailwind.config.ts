import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111729',
        surface: '#F7F7FB',
        violet: '#6557F5',
        mint: '#B9F6D0',
        mango: '#FFCA63'
      },
      boxShadow: { float: '0 24px 60px rgba(29, 31, 73, 0.13)' }
    }
  },
  plugins: []
} satisfies Config;
