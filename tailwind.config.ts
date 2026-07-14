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
        // Base canvas carries a soft baby-pink warmth; cards stay pure white.
        canvas: "#FCF4F7",
        card: "#FFFFFF",
        ink: {
          DEFAULT: "#141115",
          muted: "#6B646A",
        },
        line: "#F0E6EB",
        // Accent is a CSS variable so it can be re-themed at runtime from
        // Settings. Channels are space-separated RGB for alpha support.
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
        },
        success: "#3FA66B",
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
        soft: "0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.04)",
        lift: "0 2px 4px rgba(17,17,17,0.04), 0 18px 48px rgba(17,17,17,0.10)",
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
