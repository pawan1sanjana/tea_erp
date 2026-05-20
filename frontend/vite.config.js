import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 5176,
    host: true,
    https: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      }
    }
  },
  base: '/',
  css: {
    postcss: './postcss.config.js'
  }
})
