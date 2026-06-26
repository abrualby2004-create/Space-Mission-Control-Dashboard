/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          dark: "#020817",
          navy: "#0a1628",
          blue: "#0f2444",
          accent: "#00d4ff",
          green: "#00ff88",
          red: "#ff4444",
          orange: "#ff8c00",
          purple: "#7c3aed",
        }
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      }
    }
  },
  plugins: []
};
