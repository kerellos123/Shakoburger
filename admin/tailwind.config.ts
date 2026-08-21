import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6d4c41",
          light: "#9c786c",
          dark: "#40241a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
