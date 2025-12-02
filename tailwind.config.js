/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // El color principal de la referencia (una mezcla entre azul y violeta)
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          hover: '#4338ca',   // indigo-700
          light: '#eef2ff',   // indigo-50 (para fondos suaves)
        }
      }
    },
  },
  plugins: [],
}