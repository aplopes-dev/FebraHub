import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', '../../../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          dark: 'var(--primary-dark)',
        },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', muted: 'hsl(var(--success-muted))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontSize: {
        'page-title': ['var(--text-page-title)', { lineHeight: 'var(--line-height-page-title)', fontWeight: '600' }],
        'page-subtitle': ['var(--text-page-subtitle)', { lineHeight: 'var(--line-height-page-subtitle)', fontWeight: '500' }],
        body: ['var(--text-body)', { lineHeight: '1.5', fontWeight: '400' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: '1.5', fontWeight: '400' }],
        auxiliary: ['var(--text-auxiliary)', { lineHeight: '1.4', fontWeight: '400' }],
        'auxiliary-md': ['var(--text-auxiliary-md)', { lineHeight: '1.4', fontWeight: '400' }],
        btn: ['14px', { lineHeight: '1', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 1px 2px hsl(222 28% 11% / 0.04), 0 4px 16px hsl(222 28% 11% / 0.06)',
        shell: '4px 0 24px hsl(222 28% 11% / 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
