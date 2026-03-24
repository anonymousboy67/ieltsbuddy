import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FCFAF8",
          100: "#F6F2ED",
          200: "#EDE6DE",
        },
        ink: {
          800: "#292524",
          600: "#57534E",
        },
        accent: {
          sage: "#047857",
          terracotta: "#C2410C",
          gold: "#D97706",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.04)",
      },
    },
  },
};

export default config;
