/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radiant: {
          50: "#fdfcff",
          100: "#f5f2ff",
          200: "#e9e2ff",
          300: "#d3c4ff",
          400: "#b394ff",
          500: "#9563ff",
          600: "#7c3ff2",
          700: "#652fcc",
          800: "#4d21a3",
          900: "#341670",
        },
        aurora: {
          teal: "#4fe0c5",
          pink: "#ff8fd6",
          gold: "#ffd166",
          blue: "#5da8ff",
        },
        glow: {
          pink: "#ffd6f2",
          blue: "#d6ecff",
          gold: "#fff2cc",
        },
      },
      backgroundImage: {
        "radiant-gradient":
          "radial-gradient(circle at 20% 20%, #ffe9fa 0%, transparent 45%), radial-gradient(circle at 80% 0%, #e0ecff 0%, transparent 40%), radial-gradient(circle at 50% 100%, #fff6d9 0%, transparent 45%), linear-gradient(180deg, #fbfaff 0%, #f4f1ff 100%)",
        "aurora-mesh":
          "conic-gradient(from 180deg at 50% 50%, #9563ff, #5da8ff, #4fe0c5, #ff8fd6, #ffd166, #9563ff)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(124, 63, 242, 0.12)",
        glow: "0 0 40px rgba(149, 99, 255, 0.25)",
        "glow-lg": "0 0 70px rgba(149, 99, 255, 0.35)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(124, 63, 242, 0.14)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.08)" },
          "66%": { transform: "translate(-3%, 4%) scale(0.94)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        blob: "blob 18s ease-in-out infinite",
        "blob-slow": "blob 26s ease-in-out infinite",
        "spin-slow": "spin-slow 40s linear infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
