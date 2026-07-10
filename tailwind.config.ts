import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Cerebri Sans"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // Portal uses 15px base, not 16px
        xs:   ['0.625rem',  { lineHeight: '1.5' }],   // 10px
        sm:   ['0.8125rem', { lineHeight: '1.5' }],   // 13px
        base: ['0.9375rem', { lineHeight: '1.5' }],   // 15px
        lg:   ['1.0625rem', { lineHeight: '1.5' }],   // 17px
        xl:   ['1.2890625rem', { lineHeight: '1.25' }], // ~20.6px
        // Headings
        'h6': ['0.625rem',  { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h5': ['0.8125rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h4': ['0.9375rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h3': ['1.0625rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h2': ['1.25rem',   { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h1': ['1.625rem',  { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        // Display sizes
        'display-4': ['2rem',     { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-3': ['2.625rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-2': ['3.25rem',  { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-1': ['4rem',     { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',  // headings
        semibold: '600', // "bold" in this system is 600
        bold: '600',    // bold in this system is 600, NOT 700
        bolder: '700',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: '#1862C2',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        danger: {
          DEFAULT: '#E63757',
        },
        light: {
          DEFAULT: '#EDF2F9',
        },
        dark: {
          DEFAULT: '#12263F',
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Greenfly Grayscale (direct hex for utility)
        gray: {
          100: '#F9FBFD',
          200: '#EDF2F9',
          300: '#E3EBF6',
          400: '#D2DDEC',
          500: '#B1C2D9',
          600: '#95AAC9',
          700: '#6E84A3',
          800: '#3B506C',
          900: '#283E59',
        },
        black: '#12263F',
        // Figma "Colors" palette (used for icon theming, e.g. activity feed icon circles)
        accent: {
          blue: '#2C7BE5',
          indigo: '#727CF5',
          violet: '#9747FF',
          purple: '#6B5EAE',
          pink: '#FF679B',
          red: '#E63757',
          orange: '#FD7E14',
          yellow: '#F6C343',
          green: '#00D97E',
          teal: '#02A8B5',
          cyan: '#39AFD1',
          gf: '#3AAB47',
        },
        // Body colors
        body: {
          DEFAULT: '#12263F',
          bg: '#F8FBFD',
          secondary: '#6E84A3',
        },
        // Contextual
        scheduled: '#F3A536',
        "public-gallery": '#9747FF',
        // Social
        instagram: { DEFAULT: '#E63757', light: '#FAD9E0' },
        twitter: { DEFAULT: '#000000', light: '#E6E6E6' },
        facebook: { DEFAULT: '#1A41E1', light: '#DBE2F9' },
        tiktok: { DEFAULT: '#000000', light: '#E6E6E6' },
        'additional-platforms': { DEFAULT: '#5C5C5C', light: '#828282' },
        // Navigation
        nav: {
          background: "hsl(var(--nav-background))",
          border: "hsl(var(--nav-border))",
          text: "hsl(var(--nav-text))",
          "text-hover": "hsl(var(--nav-text-hover))",
          "text-active": "hsl(var(--nav-text-active))",
          "active-border": "hsl(var(--nav-active-border))",
          heading: "hsl(var(--nav-heading))",
        },
        topnav: {
          icon: "hsl(var(--topnav-icon))",
          "icon-hover": "hsl(var(--topnav-icon-hover))",
          "icon-mobile": "hsl(var(--topnav-icon-mobile))",
        },
        // Sidebar
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Tooltip
        tooltip: {
          DEFAULT: "hsl(var(--tooltip))",
          foreground: "hsl(var(--tooltip-foreground))",
        },
        // Channel Switcher
        channel: {
          text: "hsl(var(--channel-text))",
          active: "hsl(var(--channel-active))",
          border: "hsl(var(--channel-border))",
          "input-border": "hsl(var(--channel-input-border))",
          hover: "hsl(var(--channel-hover))",
          placeholder: "hsl(var(--channel-placeholder))",
          focus: "hsl(var(--channel-focus))",
        },
      },
      spacing: {
        // Bootstrap/Dashkit spacers (base $spacer = 1.5rem = 24px)
        'gf-1': '0.1875rem',  // 3px  ($spacer * .125)
        'gf-2': '0.375rem',   // 6px  ($spacer * .25)
        'gf-3': '0.75rem',    // 12px ($spacer * .5)
        'gf-4': '1.5rem',     // 24px ($spacer)
        'gf-5': '2.25rem',    // 36px ($spacer * 1.5)
        'gf-6': '4.5rem',     // 72px ($spacer * 3)
        'gf-7': '6.75rem',    // 108px ($spacer * 4.5)
        'gf-8': '13.5rem',    // 216px ($spacer * 9)
      },
      borderRadius: {
        xs:   '0.1875rem', // 3px
        sm:   '0.25rem',   // 4px
        DEFAULT: '0.375rem', // 6px
        md: '0.375rem',    // 6px (alias)
        lg:   '0.5rem',    // 8px
        pill: '200px',
      },
      boxShadow: {
        card:    '0 0.75rem 1.5rem rgba(18,38,63,0.03)',
        lift:    '0 1rem 2.5rem rgba(18,38,63,0.1), 0 0.5rem 1rem -0.75rem rgba(18,38,63,0.1)',
        'lift-lg': '0 2rem 5rem rgba(18,38,63,0.1), 0 0.5rem 1rem -0.75rem rgba(18,38,63,0.05)',
        channel: '0 0 7px 0 rgba(0, 0, 0, 0.19)',
      },
      screens: {
        // Bootstrap 5.3 breakpoints
        sm:  '576px',
        md:  '768px',
        lg:  '992px',
        xl:  '1200px',
        xxl: '1400px',
      },
      maxWidth: {
        // Container max-widths
        'container-sm': '540px',
        'container-md': '720px',
        'container-lg': '960px',
        'container-xl': '1140px',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
