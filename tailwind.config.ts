import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kyobo-ish deep green as the brand accent, kept neutral/professional otherwise
        brand: {
          50: "#eefaf3",
          100: "#d6f2e2",
          500: "#1a8f5a",
          600: "#0f7a49",
          700: "#0b5f39",
        },
      },
    },
  },
  plugins: [],
};

export default config;
