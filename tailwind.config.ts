import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: {
          DEFAULT: "#00E599", // High-tech mint green like financial algo trading
          dark: "#00B87A",
          light: "#33EAB0",
        },
        secondary: {
          DEFAULT: "#3B82F6", // Broker blue
          dark: "#2563EB",
        },
        danger: {
          DEFAULT: "#EF4444",
          dark: "#DC2626",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
        },
        surface: {
          50: "#0F172A",
          100: "#0B1120",
          200: "#070B14",
          300: "#1E293B",
          400: "#334155",
        }
      },
    },
  },
  plugins: [],
};

export default config;

