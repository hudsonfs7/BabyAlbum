
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
    "./styles.ts",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'Quicksand', 'sans-serif'],
        sans: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
