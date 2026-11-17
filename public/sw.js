/* ============================================================
   KUHP DIGITAL — Service Worker
   Strategi:
   · Precache shell aplikasi + dataset saat instalasi.
   · Navigasi: network-first dengan fallback cache (offline penuh).
   · Aset ber-hash: cache-first (immutable).
   Aplikasi sepenuhnya statis; tidak ada permintaan ke server data.
   ============================================================ */

const VERSI = 'kuhp-v1.2.0'
const SHELL = `${VERSI}-shell`
const ASET = `${VERSI}-aset`

/* Aplikasi dapat dipasang di akar domain (/) maupun di subfolder
   (mis. GitHub Pages: /kuhp-digital/). Semua path diturunkan dari lokasi
   service worker ini, bukan di-hardcode ke akar. */
const AKAR = new URL('./', self.location).pathname      // '/' atau '/kuhp-digital/'
const URL_SHELL = `${AKAR}index.html`
const URL_AKAR = AKAR

const BERKAS_SHELL = [
  URL_AKAR,
  URL_SHELL,
  `${AKAR}manifest.webmanifest`,
  `${AKAR}icons/icon.svg`,
  `${AKAR}icons/maskable.svg`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(BERKAS_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !k.startsWith(VERSI)).map(k => caches.delete(k)),
    )).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navigasi halaman -> network first, fallback ke cache/offline shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const salinan = res.clone()
          caches.open(SHELL).then(c => c.put(URL_SHELL, salinan)).catch(() => undefined)
          return res
        })
        .catch(async () => (await caches.match(URL_SHELL)) ?? (await caches.match(URL_AKAR)) ?? Response.error()),
    )
    return
  }

  // Aset statis (js/css/svg/ikon) -> stale-while-revalidate.
  // Versi lama memakai cache-first murni: setelah deploy, peramban terus
  // menyajikan CSS/JS lama sehingga perubahan tidak pernah terlihat.
  event.respondWith(
    caches.match(req).then(hit => {
      const jaringan = fetch(req).then(res => {
        if (res.ok && (url.pathname.startsWith(`${AKAR}assets/`) || url.pathname.startsWith(`${AKAR}icons/`))) {
          const salinan = res.clone()
          caches.open(ASET).then(c => c.put(req, salinan)).catch(() => undefined)
        }
        return res
      }).catch(() => undefined)

      if (hit) {
        event.waitUntil(jaringan)   // perbarui diam-diam untuk permintaan berikutnya
        return hit
      }
      return jaringan.then(res => res ?? Response.error())
    }),
  )
})
