/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#4ECDC4",
          hover: "#3FBDB4",
          dark: "#2FADAD"
        },
        pixel: {
          cream: "#FAF6F0",
          teal: "#4ECDC4",
          red: "#FF6B6B",
          yellow: "#FFD93D",
          peach: "#FFD3B6",
          lavender: "#C7CEEA",
          mint: "#A8E6CF",
          blue: "#4A90E2"
        }
      },
      fontFamily: {
        sora: ["Sora", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"]
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        hard: "4px 4px 0 rgba(0, 0, 0, 1)",
        "hard-sm": "3px 3px 0 rgba(0, 0, 0, 1)",
        "hard-lg": "6px 6px 0 rgba(0, 0, 0, 1)",
        "hard-xl": "8px 8px 0 rgba(0, 0, 0, 1)",
        "hard-active": "2px 2px 0 rgba(0, 0, 0, 1)"
      },
      borderRadius: {
        DEFAULT: "0",
        none: "0"
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(.2,.8,.2,1)',
      }
    }
  },
  plugins: []
};
