import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        app: '#05060b',
        phone: 'rgba(12, 15, 24, 0.92)',
        card: 'rgba(15, 18, 30, 0.78)',
        line: 'rgba(255,255,255,0.08)',
        brand: '#7c3aed',
        brandDark: '#4c1d95',
        brandSoft: '#a855f7'
      },
      boxShadow: {
        glow: '0 18px 60px rgba(124, 58, 237, 0.35)',
        soft: '0 24px 80px rgba(0, 0, 0, 0.35)',
        phone: '0 30px 100px rgba(0, 0, 0, 0.45)'
      }
    }
  },
  plugins: []
};

export default config;
