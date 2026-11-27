import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./context/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#08040f", 900: "#0e0820", 800: "#150c2e" },
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        eq: { "0%,100%": { transform: "scaleY(.25)" }, "50%": { transform: "scaleY(1)" } },
        drift: { "0%": { transform: "translate3d(0,0,0) scale(1)" }, "100%": { transform: "translate3d(7vw,5vh,0) scale(1.12)" } },
        rise: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        eq: "eq 900ms ease-in-out infinite",
        "drift-a": "drift 22s ease-in-out infinite alternate",
        "drift-b": "drift 28s ease-in-out -8s infinite alternate-reverse",
        "drift-c": "drift 25s ease-in-out -14s infinite alternate",
        rise: "rise 500ms cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
