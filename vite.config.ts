import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of www.rootlabs.studio. Set BASE_PATH (e.g. /Rootlabs.studio/) only when
  // serving from a subpath such as a github.io project URL.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
})
