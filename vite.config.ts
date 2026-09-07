import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' makes built asset paths relative so the site works when
// deployed under any GitHub Pages project subpath without configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
})
