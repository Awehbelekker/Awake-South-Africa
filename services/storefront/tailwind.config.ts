import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "awake-black": "#0a0a0a",
        "awake-dark": "#141414",
        "awake-charcoal": "#1a1a1a",
        "awake-gray": "#2a2a2a",
        "accent-primary": "#00d4ff",
        "accent-secondary": "#00a8cc",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
