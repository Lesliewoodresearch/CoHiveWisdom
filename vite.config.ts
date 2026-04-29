import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    {
      name: 'figma-asset-resolver',
      enforce: 'pre',
      resolveId(id) {
        if (id.startsWith('figma:asset/')) {
          return '\0' + id
        }
      },
      load(id) {
        if (id.startsWith('\0figma:asset/')) {
          // Return 1x1 transparent PNG placeholder for production builds
          return `export default "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="`
        }
      }
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('figma:asset')) {
          return
        }
        warn(warning)
      }
    }
  }
})
