import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/ghost-user/',
  build: {
    // Raise the warning threshold slightly — anything over this still warns.
    // With alasql in its own chunk it won't be hit, but this silences false
    // positives from other tools that get bundled alongside small deps.
    outDir: 'docs',
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // AlaSQL is ~1.2 MB — always its own chunk, loaded lazily by useDb.js
          if (id.includes('node_modules/alasql')) {
            return 'vendor-alasql'
          }

          // Vue ecosystem in one shared chunk
          if (
              id.includes('node_modules/vue/') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia')
          ) {
            return 'vendor-vue'
          }

          // Everything else in node_modules gets its own auto-named chunk
          // (Vite's default behaviour for remaining deps)
        },
      },
    },
  },
})