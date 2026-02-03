import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          three: ['three'],
          examples: ['three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/loaders/SVGLoader.js'],
          fiber: ['@react-three/fiber', '@react-three/drei'],
        }
      }
    }
  }
})
