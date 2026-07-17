/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F7F4',
        ink: '#1C2321',
        blueprint: {
          50: '#EEF1FA',
          100: '#D7DEF0',
          300: '#8C9BC9',
          500: '#48568C',
          700: '#2B3A67',
          900: '#1A2340'
        },
        signal: {
          DEFAULT: '#FF6B4A',
          dark: '#E0502F',
          light: '#FFE3DB'
        },
        moss: {
          DEFAULT: '#3EB489',
          light: '#D9F2E7'
        },
        amber: {
          DEFAULT: '#F5A524',
          light: '#FDF0DA'
        },
        gridline: '#DCE1DD'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        'grid-paper': 'linear-gradient(#DCE1DD 1px, transparent 1px), linear-gradient(90deg, #DCE1DD 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '28px 28px'
      }
    }
  },
  plugins: []
}
