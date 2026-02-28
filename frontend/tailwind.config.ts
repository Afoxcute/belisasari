import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import colors from "tailwindcss/colors";
// @ts-ignore
import { default as flattenColorPalette } from "tailwindcss/lib/util/flattenColorPalette";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        'nouns': ['Londrina Solid', 'serif'],
        'sen': ['Sen', 'sans-serif'],
        'meme-title': ['Fredoka', 'sans-serif'],
        'meme-subtitle': ['Comic Neue', 'cursive'],
        'meme-body': ['Quicksand', 'sans-serif'],
        'crypto-tech': ['Space Grotesk', 'sans-serif'],
        'crypto-futuristic': ['Orbitron', 'monospace'],
        'crypto-bold': ['Rajdhani', 'sans-serif'],
        'meme-playful': ['Fredoka', 'sans-serif'],
        'meme-comic': ['Comic Neue', 'cursive'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Black & White Brand Colors
        iris: {
          primary: "hsl(var(--iris-primary))",
          secondary: "hsl(var(--iris-secondary))",
          accent: "hsl(var(--iris-accent))",
          light: "hsl(var(--iris-light))",
          dark: "hsl(var(--iris-dark))",
        },
        // HTML Template Colors
        "primary-hover": "#0284C7",
        "background-main": "#F8FAFC",
        "card-bg": "#FFFFFF",
        "border-light": "#E2E8F0",
        "text-main": "#0F172A",
        "text-secondary": "#64748B",
        "success": "#10B981",
        "danger": "#EF4444",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), addVariablesForColors],
};

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
export default config;
