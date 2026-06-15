import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:18081',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:18081',
        changeOrigin: true,
      },
    },
  },
})
