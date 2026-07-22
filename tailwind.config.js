/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: "#0F172A", // Slate 900
        secondary: "#1E293B", // Slate 800
        brand: {
          DEFAULT: "#2563EB", // Blue 600
          dark: "#1E40AF", // Blue 800
          light: "#60A5FA", // Blue 400
        },
        accent: {
          slate: "#64748B", // Slate 500
          subtle: "#F1F5F9", // Slate 100
          indigo: { light: "#E0E7FF", DEFAULT: "#6366F1", dark: "#4F46E5" },
          violet: { light: "#EDE9FE", DEFAULT: "#8B5CF6", dark: "#7C3AED" },
          emerald: { light: "#D1FAE5", DEFAULT: "#10B981", dark: "#059669" },
          amber: { light: "#FEF3C7", DEFAULT: "#F59E0B", dark: "#D97706" },
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "sans-serif"],
        display: ["Inter", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
}
