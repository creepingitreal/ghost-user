import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/ghost-user/',
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        manualChunks: {
          // AlaSQL is ~1MB — keep it in its own chunk, loaded lazily
          'vendor-alasql': ['alasql'],
          // Vue ecosystem in its own chunk
          'vendor-vue': ['vue', 'vue-router'],
        },
      },
    },
  }
})