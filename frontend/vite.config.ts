import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const apiProxy = {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
} as const

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { ...apiProxy },
  },
  // `vite preview` does not inherit `server.proxy`; without this, /api/* hits the static server (404).
  preview: {
    port: 5173,
    proxy: { ...apiProxy },
  },
})