import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07080d',
        panel: '#11131c',
        panelSoft: '#181b27',
        line: '#262a3a',
        brand: '#7c3aed',
        brandSoft: '#a855f7',
        success: '#22c55e',
        warning: '#f59e0b'
      },
      boxShadow: {
        glow: '0 20px 80px rgba(124,58,237,.25)'
      }
    }
  },
  plugins: []
};

export default config;
