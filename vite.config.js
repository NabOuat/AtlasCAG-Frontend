import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api':   { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
          if (id.includes('recharts'))  return 'vendor-charts'
          if (id.includes('leaflet'))   return 'vendor-map'
          if (id.includes('lucide'))    return 'vendor-icons'
          if (id.includes('axios') || id.includes('zustand') || id.includes('dayjs')) return 'vendor-utils'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
