import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analysis': process.env.VITE_API_URL || 'http://localhost:3001',
      '/api': process.env.VITE_API_URL || 'http://localhost:3001',
    },
  },
  define: {
    // Expose environment variables to the client
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
  build: {
    // Ensure environment variables are available at build time
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
