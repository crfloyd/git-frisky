import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@gitfrisky/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
    },
  },
})
