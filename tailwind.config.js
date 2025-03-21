import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1ABC9C",
        secondary: "#FFA500",
        background: "#121212",
        foreground: "#FFFFFF",
        muted: "#2A2A2A",
        accent: "#1A1A1A",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
}
