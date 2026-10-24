/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050308",
          900: "#0a0612",
          850: "#0f0a1c",
          800: "#140d26",
          700: "#1c1438",
          600: "#261a4d",
        },
        violet: {
          50: "#f5f0ff",
          100: "#ede4ff",
          200: "#dcc8ff",
          300: "#c4a3ff",
          400: "#a875ff",
          500: "#8b3fff",
          600: "#7c2dff",
          700: "#6b1fe6",
          800: "#5818b8",
          900: "#4a1499",
        },
        blue: {
          400: "#4d9fff",
          500: "#2d7fff",
          600: "#1565f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease forwards",
        "fade-in": "fade-in 0.5s ease forwards",
        "slide-in-right": "slide-in-right 0.4s ease forwards",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { "background-position": "-1000px 0" },
          "100%": { "background-position": "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};
