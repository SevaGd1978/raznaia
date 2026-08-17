import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: /raznaia/
// Local/tunnel: set VITE_BASE=/ or leave unset
const base = process.env.VITE_BASE ?? '/raznaia/'

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
