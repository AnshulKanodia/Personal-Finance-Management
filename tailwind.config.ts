import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // zinc-950 OLED black
        foreground: "#fafafa",
        card: {
          DEFAULT: "#0f0f12",
          border: "#27272a",
        },
        accent: {
          emerald: "#10b981", // Income / Receivables
          rose: "#f43f5e",    // Expenses / Payables
          sky: "#0ea5e9",     // UPI
          amber: "#f59e0b",   // Cash
          violet: "#8b5cf6",  // Card / Net Banking
        }
      },
    },
  },
  plugins: [],
};

export default config;
