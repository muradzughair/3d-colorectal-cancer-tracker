import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // three.js is large; this only silences the "big file" notice when building.
  build: { chunkSizeWarningLimit: 1200 },
})
