import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built site works from any folder (for example GitHub Pages: /Colon/).
  base: './',
  // three.js is large; this only silences the "big file" notice when building.
  build: { chunkSizeWarningLimit: 1200 },
})
