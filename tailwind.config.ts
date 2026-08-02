import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Every surface token is a CSS variable (space-separated RGB channels
        // for alpha support) so the whole palette re-themes at runtime from
        // Settings — light "Blossom", elegant charcoal "Dark", "Warm Paper".
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        // Subtle surface fill: near-black on light themes, near-white on dark —
        // so `bg-fill/[0.05]` reads correctly in every theme.
        fill: "rgb(var(--fill) / <alpha-value>)",
        // Overlay scrim — always dark, regardless of theme (backdrops, toasts).
        scrim: "rgb(var(--scrim) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "#F0B429",
        alert: "#E5484D",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Editorial display face — favours installed premium serifs, then
        // graceful system fallbacks. No web-font fetch required.
        display: [
          "Fraunces",
          "Iowan Old Style",
          "Palatino Linotype",
          "Palatino",
          "Georgia",
          "Cambria",
          "serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // Theme-driven so shadows deepen appropriately on dark/paper surfaces.
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
        glow: "0 8px 30px rgb(var(--accent) / 0.28)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
