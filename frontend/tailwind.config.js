/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // iOS system palette
        ios: {
          blue: "#0A84FF",
          green: "#30D158",
          red: "#FF453A",
          orange: "#FF9F0A",
          purple: "#BF5AF2",
          gray: "#8E8E93",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};
