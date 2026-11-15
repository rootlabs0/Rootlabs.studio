import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /Rootlabs.studio/, so the deploy workflow sets BASE_PATH.
  // Locally (and on a custom domain) it stays at the root.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
})
