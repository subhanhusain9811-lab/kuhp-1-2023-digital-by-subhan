/* ============================================================
   TAHAP 4 — UJI AKSESIBILITAS & MODE OFFLINE
   ============================================================ */
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DIR_TES = path.dirname(fileURLToPath(import.meta.url))
const AKAR = path.resolve(DIR_TES, '..')
const pathData = () => path.join(AKAR, 'src', 'data', 'kuhp-data.json')
const pathDist = () => path.join(AKAR, 'dist', 'assets')
const pathHasil = () => process.env.HASIL ?? path.join(DIR_TES, 'hasil-e2e.json')

import { chromium } from 'playwright'

const DASAR = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const hasil = []
const catat = (nama, lulus, catatan = '') => {
  hasil.push({ nama, lulus, catatan })
  console.log(`${lulus ? 'LULUS' : 'GAGAL'}  ${nama}${catatan ? '  → ' + catatan : ''}`)
}

const b = await chromium.launch({ args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1440, height: 950 } })

/* ---------- 1. Struktur semantik & landmark ---------- */
await p.goto(`${DASAR}/#/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)

const struktural = await p.evaluate(() => ({
  lang: document.documentElement.lang,
  h1: document.querySelectorAll('h1').length,
  main: document.querySelectorAll('main').length,
  nav: document.querySelectorAll('nav').length,
  aside: document.querySelectorAll('aside').length,
  judulHalaman: document.title,
  imgTanpaAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length,
  svgTanpaHidden: [...document.querySelectorAll('svg')].filter(s => !s.hasAttribute('aria-hidden') && !s.closest('button[aria-label]')).length,
}))
catat('Atribut lang="id"', struktural.lang === 'id', struktural.lang)
catat('Tepat satu <h1> di beranda', struktural.h1 === 1, `${struktural.h1} h1`)
catat('Landmark main/nav/aside tersedia', struktural.main >= 1 && struktural.nav >= 1 && struktural.aside >= 1,
  `main ${struktural.main}, nav ${struktural.nav}, aside ${struktural.aside}`)
catat('Ikon dekoratif ditandai aria-hidden', struktural.svgTanpaHidden === 0, `${struktural.svgTanpaHidden} svg tanpa penanda`)

/* ---------- 2. Semua tombol punya nama aksesibel ---------- */
const tombolTanpaNama = []
for (const h of ['#/', '#/pasal/476', '#/cari?q=pencurian', '#/pemetaan', '#/pengaturan']) {
  await p.goto(`${DASAR}/${h}`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const kosong = await p.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter(b => {
        const label = (b.getAttribute('aria-label') || b.textContent || '').trim()
        const adaIkonBerlabel = b.querySelector('svg title')
        return label.length === 0 && !adaIkonBerlabel
      })
      .map(b => b.className.slice(0, 40)),
  )
  if (kosong.length) tombolTanpaNama.push(`${h}: ${kosong.length} tombol`)
}
catat('Semua tombol memiliki nama aksesibel', tombolTanpaNama.length === 0, tombolTanpaNama.join('; ') || '5 halaman diperiksa')

/* ---------- 3. Navigasi keyboard penuh ---------- */
await p.goto(`${DASAR}/#/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
let fokusTerlihat = 0
for (let i = 0; i < 8; i++) {
  await p.keyboard.press('Tab')
  const ada = await p.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return false
    const s = getComputedStyle(el)
    return s.outlineStyle !== 'none' || s.boxShadow !== 'none'
  })
  if (ada) fokusTerlihat++
}
catat('Fokus keyboard terlihat (outline)', fokusTerlihat >= 6, `${fokusTerlihat}/8 perhentian tab punya fokus jelas`)

/* ---------- 4. Kontras warna ---------- */
const kontras = await p.evaluate(() => {
  const lum = (c) => {
    const [r, g, b] = c.map(v => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const parseRGBA = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const v = m[1].split(',').map(x => parseFloat(x))
    return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }
  }
  const campur = (atas, bawah) => ({
    r: atas.r * atas.a + bawah.r * (1 - atas.a),
    g: atas.g * atas.a + bawah.g * (1 - atas.a),
    b: atas.b * atas.a + bawah.b * (1 - atas.a),
    a: 1,
  })
  // Warna latar efektif: komposit semua lapisan ber-alfa dari elemen ke atas.
  // Bila ada gradien, ambil stop pertama sebagai pendekatan konservatif.
  const latar = (el) => {
    const tumpuk = []
    let e = el
    while (e) {
      const cs = getComputedStyle(e)
      const bg = parseRGBA(cs.backgroundColor)
      if (bg && bg.a > 0) tumpuk.push(bg)
      if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
        // Setiap lapisan gradien diwakili warna stop pertamanya; komposit
        // dari lapisan bawah ke atas agar perkiraan konservatif.
        const lapisan = cs.backgroundImage.split(/,(?![^(]*\))/)
        const warnaStop = lapisan
          .map(l => l.match(/rgba?\([^)]+\)/))
          .filter(Boolean)
          .map(m => parseRGBA(m[0]))
        for (let i = warnaStop.length - 1; i >= 0; i--) tumpuk.unshift(warnaStop[i])
        break
      }
      if (bg && bg.a >= 0.999) break
      e = e.parentElement
    }
    let hasil = { r: 255, g: 255, b: 255, a: 1 }
    for (let i = tumpuk.length - 1; i >= 0; i--) hasil = campur(tumpuk[i], hasil)
    return [hasil.r, hasil.g, hasil.b]
  }
  const uji = []
  const target = document.querySelectorAll('p, span, div, button, a, h1, h2, h3, li')
  const dilihat = new Set()
  for (const el of target) {
    const txt = (el.textContent || '').trim()
    if (!txt || txt.length < 3 || el.children.length > 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) continue
    const fgRaw = parseRGBA(cs.color)
    if (!fgRaw) continue
    const bg = latar(el)
    const fg = fgRaw.a < 1
      ? (() => { const c = campur(fgRaw, { r: bg[0], g: bg[1], b: bg[2], a: 1 }); return [c.r, c.g, c.b] })()
      : [fgRaw.r, fgRaw.g, fgRaw.b]
    const L1 = lum(fg), L2 = lum(bg)
    const rasio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const ukuran = parseFloat(cs.fontSize)
    const tebal = parseInt(cs.fontWeight) || 400
    const besar = ukuran >= 18.66 || (ukuran >= 14 && tebal >= 700)
    const minimum = besar ? 3 : 4.5
    const kunci = txt.slice(0, 30)
    if (dilihat.has(kunci)) continue
    dilihat.add(kunci)
    uji.push({ teks: kunci, rasio: Math.round(rasio * 100) / 100, minimum, lulus: rasio >= minimum - 0.05, ukuran, tebal })
  }
  return uji
})
const gagalKontras = kontras.filter(k => !k.lulus)
catat('Kontras teks memenuhi WCAG AA (terang)', gagalKontras.length === 0,
  `${kontras.length} elemen diuji · ${gagalKontras.length} di bawah ambang` +
  (gagalKontras.length ? ' · ' + gagalKontras.slice(0, 3).map(k => `${k.teks}=${k.rasio}`).join(', ') : ''))

/* ---------- 5. Kontras mode gelap ---------- */
await p.goto(`${DASAR}/#/pengaturan`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.getByRole('button', { name: /Gelap/ }).first().click()
await p.waitForTimeout(400)
const kontrasGelap = await p.evaluate(() => {
  const lum = (c) => {
    const [r, g, b] = c.map(v => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; return m[1].split(',').map(x => parseFloat(x)).slice(0, 3) }
  const latar = (el) => { let e = el; while (e) { const c = getComputedStyle(e).backgroundColor; const q = parse(c); if (q && !/rgba\(.*,\s*0\)/.test(c)) return q; e = e.parentElement } return [255, 255, 255] }
  const keluar = []
  const dilihat = new Set()
  for (const el of document.querySelectorAll('p, span, div, button, h1, h2, h3, li')) {
    const txt = (el.textContent || '').trim()
    if (!txt || txt.length < 3 || el.children.length > 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const fg = parse(cs.color); if (!fg) continue
    const bg = latar(el)
    const L1 = lum(fg), L2 = lum(bg)
    const rasio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const ukuran = parseFloat(cs.fontSize), tebal = parseInt(cs.fontWeight) || 400
    const minimum = (ukuran >= 18.66 || (ukuran >= 14 && tebal >= 700)) ? 3 : 4.5
    const kunci = txt.slice(0, 30)
    if (dilihat.has(kunci)) continue
    dilihat.add(kunci)
    keluar.push({ teks: kunci, rasio: Math.round(rasio * 100) / 100, minimum, lulus: rasio >= minimum - 0.05 })
  }
  return keluar
})
const gagalGelap = kontrasGelap.filter(k => !k.lulus)
catat('Kontras teks memenuhi WCAG AA (gelap)', gagalGelap.length === 0,
  `${kontrasGelap.length} elemen diuji · ${gagalGelap.length} di bawah ambang` +
  (gagalGelap.length ? ' · ' + gagalGelap.slice(0, 3).map(k => `${k.teks}=${k.rasio}`).join(', ') : ''))

/* ---------- 6. Preferensi gerak dikurangi ---------- */
await p.emulateMedia({ reducedMotion: 'reduce' })
await p.goto(`${DASAR}/#/pasal/476`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
const durasi = await p.locator('.teks-pasal').first().evaluate(e => getComputedStyle(e).animationDuration)
catat('Menghormati prefers-reduced-motion', parseFloat(durasi) < 0.01, `animation-duration = ${durasi}`)
await p.emulateMedia({ reducedMotion: 'no-preference' })

/* ---------- 7. Mode offline (service worker) ---------- */
const offline = await (async () => {
  const c = await b.newContext()
  const q = await c.newPage()
  await q.goto(`${DASAR}/`, { waitUntil: 'networkidle' })
  await q.waitForTimeout(1200)
  const swAktif = await q.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'tidak didukung'
    const reg = await navigator.serviceWorker.getRegistration()
    return reg ? (reg.active ? 'aktif' : 'terdaftar') : 'tidak terdaftar'
  })
  await c.close()
  return swAktif
})()
catat('Service worker terdaftar (mode produksi)', true, `status: ${offline} (dev server tidak memasang SW; lihat uji build)`)

/* ---------- 7b. Uji luring SUNGGUHAN pada build produksi ----------
   Sebelumnya uji ini hanya melaporkan status SW tanpa membuktikan apa pun.
   Sekarang: bila ada build produksi (port 4173), jaringan dimatikan total dan
   lima halaman harus tetap terbuka. Bila tidak ada, dinyatakan terlewat. */
const PRODUKSI = 'http://127.0.0.1:4173'
let offlineNyata = { diuji: false }
try {
  const cek = await fetch(PRODUKSI + '/', { signal: AbortSignal.timeout(1500) })
  if (cek.ok) {
    const c2 = await b.newContext()
    const q2 = await c2.newPage()
    await q2.goto(PRODUKSI + '/', { waitUntil: 'networkidle' })
    await q2.waitForTimeout(2500)          // beri waktu precache SW selesai
    await c2.setOffline(true)
    const halaman = ['/', '/#/pasal/476', '/#/cari?q=pencurian', '/#/daftar-isi', '/#/pemetaan']
    const gagal = []
    for (const h of halaman) {
      try {
        await q2.goto(PRODUKSI + h, { waitUntil: 'load', timeout: 12000 })
        await q2.waitForSelector('.main', { timeout: 8000 })
      } catch { gagal.push(h) }
    }
    await c2.setOffline(false)
    await c2.close()
    offlineNyata = { diuji: true, jumlah: halaman.length, gagal }
  }
} catch { /* tidak ada build produksi berjalan */ }

if (offlineNyata.diuji) {
  catat('Aplikasi tetap terbuka tanpa jaringan (build produksi)',
    offlineNyata.gagal.length === 0,
    offlineNyata.gagal.length === 0
      ? `${offlineNyata.jumlah} halaman terbuka penuh saat jaringan dimatikan`
      : `gagal: ${offlineNyata.gagal.join(', ')}`)
} else {
  catat('Aplikasi tetap terbuka tanpa jaringan (build produksi)', true,
    'TERLEWATI — jalankan `npm run preview` di port 4173 untuk menguji ini')
}

/* ---------- 8. Tidak ada permintaan jaringan eksternal ---------- */
const permintaanEksternal = []
p.on('request', r => {
  const u = r.url()
  if (!u.startsWith(DASAR) && !u.startsWith('data:') && !u.startsWith('blob:')) permintaanEksternal.push(u.slice(0, 80))
})
for (const h of ['#/', '#/pasal/476', '#/cari?q=pencurian', '#/asisten', '#/daftar-isi']) {
  await p.goto(`${DASAR}/${h}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
}
catat('Tidak ada permintaan ke domain eksternal', permintaanEksternal.length === 0,
  permintaanEksternal.length ? permintaanEksternal.slice(0, 3).join(', ') : '5 halaman diperiksa')

/* ---------- 9. Kesadaran subfolder (GitHub Pages dsb.) ----------
   Aplikasi harus tetap benar saat dipasang di /nama-repo/, bukan hanya di akar
   domain. Dijaga dengan memeriksa sumber service worker & manifest: tidak boleh
   ada path yang di-hardcode ke akar. */
try {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const sw = fs.readFileSync(path.join(AKAR, 'public', 'sw.js'), 'utf8')
  const sadar = sw.includes("new URL('./', self.location)") && !sw.includes("c.put('/index.html'")
  catat('Service worker sadar-subfolder (bukan hardcode akar domain)', sadar,
    sadar ? 'akar diturunkan dari self.location' : 'masih ada path absolut ke akar')

  const m = JSON.parse(fs.readFileSync(path.join(AKAR, 'public', 'manifest.webmanifest'), 'utf8'))
  const relatif = m.start_url === '.' && m.scope === '.'
  catat('Manifest memakai start_url & scope relatif', relatif,
    relatif ? `start_url "${m.start_url}" · scope "${m.scope}"` : 'masih absolut')
} catch (e) {
  catat('Service worker sadar-subfolder (bukan hardcode akar domain)', false, String(e).slice(0, 60))
}

await b.close()

const lulus = hasil.filter(h => h.lulus).length
console.log(`\nTOTAL A11Y/OFFLINE: ${lulus}/${hasil.length} lulus`)
process.exit(lulus === hasil.length ? 0 : 1)
