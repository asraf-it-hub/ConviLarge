/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#101828",
        mist: "#f6f8fb",
        brand: {
          50: "#eefdf8",
          100: "#d6f8ed",
          500: "#0db783",
          600: "#07956d",
          900: "#064e3b"
        },
        coral: "#ff6b5f"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};
