import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = 'https://hackaton-20261-front-587720740455.us-east1.run.app'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy same-origin: el navegador llama a /api (mismo origen, sin CORS) y
    // Vite reenvía al backend. Evita el bloqueo de CORS en métodos como PATCH.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
