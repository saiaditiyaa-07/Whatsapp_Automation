import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#020617",
        darkSurface: "#0B0F19",
        darkCard: "#161D30",
        darkBorder: "#24304F",
        darkBorderHover: "#334155",
        brandIndigo: "#6366F1",
        brandIndigoHover: "#4F46E5",
        brandGreen: "#10B981",
        brandGreenHover: "#059669",
        brandRed: "#EF4444",
        brandAmber: "#F59E0B",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.3)",
        "glow-lg": "0 0 30px -5px rgba(99, 102, 241, 0.5)",
        "glow-emerald": "0 0 20px -5px rgba(16, 185, 129, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
