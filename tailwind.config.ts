import type { Config } from "tailwindcss";

// Sacred Cipher tokens, carried over from the vanilla app's style.css
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0C",
        bg: "#101415",
        surface: "#121214",
        low: "#191c1e",
        mid: "#1d2022",
        high: "#272a2c",
        highest: "#323537",
        ink: "#e0e3e5",
        dim: "#bacbb5",
        faint: "#8a948f",
        lime: { DEFAULT: "#2EFC5D", on: "#00390d" },
        gold: "#FACC15",
        red: "#FF6B6B",
        blue: "#7ecfff",
      },
      fontFamily: {
        head: ["var(--font-head)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: { DEFAULT: "0.375rem", lg: "0.5rem", xl: "0.75rem" },
    },
  },
  plugins: [],
};
export default config;
