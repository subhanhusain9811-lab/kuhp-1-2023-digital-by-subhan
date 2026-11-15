/**
 * Konfigurasi build untuk versi SATU BERKAS.
 *
 * Berbeda dari vite.config.ts: seluruh JavaScript digabung menjadi satu bundel
 * (tanpa chunk `data` terpisah), sehingga CSS + JS dapat ditanam langsung ke
 * dalam HTML oleh scripts/build_tunggal.py.
 *
 * Pemakaian:
 *   npx vite build --config vite.config.tunggal.ts --outDir dist-tunggal
 *   python3 scripts/build_tunggal.py --dari dist-tunggal
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        // satu bundel: tidak ada impor antar-berkas yang bisa gagal di file://
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
})
