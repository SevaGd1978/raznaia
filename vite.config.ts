import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local / tunnel: /
// GitHub Pages: VITE_BASE=/raznaia/
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  preview: {
    allowedHosts: true,
  },
  server: {
    allowedHosts: true,
  },
})
