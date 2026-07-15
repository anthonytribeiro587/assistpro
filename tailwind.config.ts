import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './features/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        app: '#f5f6fb',
        ink: '#101828',
        muted: '#667085',
        line: '#e6e8f0',
        brand: '#6d28d9',
        brandDark: '#4c1d95',
        brandSoft: '#8b5cf6',
        brandLight: '#f3edff',
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626'
      },
      boxShadow: {
        card: '0 18px 50px rgba(16, 24, 40, 0.08)',
        soft: '0 10px 30px rgba(109, 40, 217, 0.16)',
        glow: '0 16px 40px rgba(109, 40, 217, 0.28)'
      },
      borderRadius: {
        '2xl-plus': '1.35rem'
      }
    }
  },
  plugins: []
};

export default config;
