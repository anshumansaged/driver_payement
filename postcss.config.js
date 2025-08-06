export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Suppress the color-adjust deprecation warning
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions",
        "not dead"
      ]
    },
  },
}
