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
      },
      boxShadow: {
        glass: "0 8px 32px rgba(124, 63, 242, 0.12)",
        glow: "0 0 40px rgba(149, 99, 255, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
