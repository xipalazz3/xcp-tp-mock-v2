import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(240 5% 84%)',
        bg: 'hsl(0 0% 100%)',
        muted: 'hsl(240 5% 96%)',
        'muted-fg': 'hsl(240 4% 46%)',
        fg: 'hsl(240 10% 4%)',
        primary: 'hsl(221 83% 53%)',
        'primary-fg': 'hsl(0 0% 100%)',
        accent: 'hsl(240 5% 94%)',
      },
      keyframes: {
        soundbar: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        soundbar: 'soundbar 0.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
