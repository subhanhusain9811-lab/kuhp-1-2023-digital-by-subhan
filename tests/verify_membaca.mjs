/* ============================================================
   TAHAP 4 — VERIFIKASI KESETIAAN REDAKSI
   Membandingkan teks yang DIRENDER aplikasi dengan dataset kanonik.
   Jalankan: node tests/verify_membaca.mjs
   ============================================================ */
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DIR_TES = path.dirname(fileURLToPath(import.meta.url))
const AKAR = path.resolve(DIR_TES, '..')
const pathData = () => path.join(AKAR, 'src', 'data', 'kuhp-data.json')
const pathDist = () => path.join(AKAR, 'dist', 'assets')
const pathHasil = () => process.env.HASIL ?? path.join(DIR_TES, 'hasil-e2e.json')

import { chromium } from 'playwright'
import fs from 'node:fs'

const DASAR = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const data = JSON.parse(fs.readFileSync(pathData(), 'utf8'))
const PETA = new Map(data.pasal.map(p => [p.nomor, p]))

const bersih = (s) =>
  s.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

const sama = (a, b) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim()

// sampel: pasal awal/akhir tiap buku, pasal yang dikoreksi, pasal berhuruf, pasal terpanjang
const sampel = [
  1, 2, 17, 36, 64, 79, 123, 132, 144, 187, 188, 217, 278, 300, 306, 342, 372,
  373, 374, 391, 406, 433, 446, 458, 459, 463, 466, 471, 476, 477, 482, 486, 492,
  507, 516, 521, 527, 542, 575, 587, 591, 597, 607, 610, 611, 622, 624,
]

const b = await chromium.launch({ args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const galat = []
p.on('pageerror', e => galat.push('PAGEERROR ' + e.message))

const hasil = []
let lulus = 0
let gagal = 0

for (const n of sampel) {
  const rek = PETA.get(n)
  await p.goto(`${DASAR}/#/pasal/${n}`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.teks-pasal', { timeout: 15000 })
  await p.waitForTimeout(120)

  const teksRender = bersih(await p.locator('.teks-pasal').first().innerHTML())

  // redaksi yang seharusnya: untuk pasal berayat, ayat pertama; selain itu teks utuh
  const berayat = rek.ayat.filter(a => a.nomor !== null)
  const acuan = berayat.length > 0
    ? bersih(berayat[0].teks)
    : bersih(rek.teks)

  const cocok = sama(teksRender, acuan)
  if (cocok) lulus++
  else gagal++
  hasil.push({ pasal: n, cocok, panjang: teksRender.length, cuplik: cocok ? '' : teksRender.slice(0, 80) })
}

await b.close()

console.log('\n=== VERIFIKASI REDAKSI (render vs dataset kanonik) ===')
for (const h of hasil) {
  console.log(`${h.cocok ? 'LULUS' : 'GAGAL'}  Pasal ${String(h.pasal).padStart(3)}  ${h.panjang} char${h.cocok ? '' : '  → ' + h.cuplik}`)
}
console.log(`\nTotal: ${hasil.length} pasal diuji · ${lulus} lulus · ${gagal} gagal`)
if (galat.length) console.log('Galat runtime:', galat)
process.exit(gagal === 0 && galat.length === 0 ? 0 : 1)
