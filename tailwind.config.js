module.exports = {
  content: [
    "./app/**/*.{js,jsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        merah: "#FC0B12",
        kuning: "#F7CC0C",
        latar: "#121212",
        kartu: "#191919",
      }
    },
  },
  plugins: [],
};
