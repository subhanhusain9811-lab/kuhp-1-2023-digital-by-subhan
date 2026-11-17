/* ============================================================
   KUHP DIGITAL — titik masuk aplikasi
   ============================================================ */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import './styles/reader.css'
import './styles/print.css'
import './styles/emas.css'

const el = document.getElementById('root')
if (!el) throw new Error('Elemen #root tidak ditemukan')

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Daftarkan service worker untuk mode offline (PWA).
   BASE_URL mengikuti `base` Vite, sehingga aplikasi tetap benar saat dipasang
   di subfolder (mis. GitHub Pages: /kuhp-digital/) maupun di akar domain. */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline opsional; abaikan bila gagal */
    })
  })
}
