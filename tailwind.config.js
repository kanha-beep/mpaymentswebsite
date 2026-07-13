/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./assets/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#bfd3ff",
          300: "#94b4ff",
          400: "#628cff",
          500: "#3d73ff",
          600: "#2f5fe6",
          700: "#274cc0",
          800: "#25429b",
          900: "#243b7a",
        },
        ink: "#20273a",
        mist: "#f5f8ff",
        cloud: "#e8eefc",
      },
      boxShadow: {
        soft: "0 24px 60px rgba(27, 51, 107, 0.14)",
        card: "0 18px 48px rgba(25, 44, 84, 0.12)",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};
