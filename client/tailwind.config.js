/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        park: {
          primary: '#2E7D32',
          light: '#E8F5E9',
          secondary: '#43A047',
          dark: '#1B5E20',
          bg: '#F7FAF7',
          card: '#FFFFFF',
          text: '#1F2937',
          muted: '#6B7280',
          border: '#DDE5DD'
        },
        slot: {
          available: '#2E7D32',
          'available-bg': '#E8F5E9',
          reserved: '#D97706',
          'reserved-bg': '#FEF3C7',
          occupied: '#DC2626',
          'occupied-bg': '#FEE2E2',
          maintenance: '#64748B',
          'maintenance-bg': '#F1F5F9'
        }
      }
    },
  },
  plugins: [],
}
