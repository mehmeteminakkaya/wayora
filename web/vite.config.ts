import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Geliştirmede /api isteklerini Express'e yönlendir (api/ varsayılan portu 4000)
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
