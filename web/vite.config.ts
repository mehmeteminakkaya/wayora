import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 5173 başka projelerle sık çakışıyor; sabit port + strictPort ile CORS ayarı hep tutarlı kalır
    port: 5180,
    strictPort: true,
    // Geliştirmede /api isteklerini Express'e yönlendir (api/ varsayılan portu 4000)
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
