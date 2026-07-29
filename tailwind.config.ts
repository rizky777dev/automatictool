import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0c0f",
          soft: "#111419",
          raised: "#161a21",
        },
        line: "rgba(255,255,255,0.08)",
        panel: "rgba(255,255,255,0.035)",
        ember: {
          DEFAULT: "#22c08c", // hijau "commit/diff" — identitas utama app ini
          soft: "#5eead4",
          dim: "rgba(34,192,140,0.14)",
        },
        gold: {
          DEFAULT: "#e8b339",
          dim: "rgba(232,179,57,0.14)",
        },
        danger: {
          DEFAULT: "#f0554c",
          dim: "rgba(240,85,76,0.14)",
        },
        slate: {
          100: "#e7e9ea",
          300: "#b7bcc0",
          400: "#8b9296",
          500: "#6b7278",
          600: "#4d5257",
          700: "#33373b",
          800: "#222528",
          900: "#17191b",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
        "gradient-ember": "linear-gradient(135deg,#22c08c 0%,#5eead4 100%)",
        "gradient-glow": "radial-gradient(60% 50% at 50% 0%, rgba(34,192,140,0.16) 0%, transparent 70%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.45)",
        "glow-ember": "0 0 0 1px rgba(34,192,140,0.4), 0 0 24px 0 rgba(34,192,140,0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(34,192,140,0.45)" },
          "100%": { boxShadow: "0 0 0 10px rgba(34,192,140,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
