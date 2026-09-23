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
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // primary warm indigo
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        sunny: {
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
        },
        coral: {
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
        },
        mint: {
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "sans-serif"],
      },
      boxShadow: {
        playful: "0 8px 0px 0px rgba(0, 0, 0, 0.08)",
        "playful-brand": "0 8px 0px 0px #4338ca",
        "playful-coral": "0 8px 0px 0px #c2410c",
        "playful-sunny": "0 8px 0px 0px #ca8a04",
        "playful-mint": "0 8px 0px 0px #15803d",
      },
    },
  },
  plugins: [],
};

export default config;
