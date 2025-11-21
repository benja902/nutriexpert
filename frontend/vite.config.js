import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Permitir conexiones desde fuera (necesario para túneles)
    port: 5173,
    strictPort: true,
    hmr: false, // Deshabilitar HMR para evitar problemas con WebSocket en túneles
  }
})
