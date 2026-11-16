/* Uji A (saringan pencarian 2026) + B (ekspor mencantumkan perubahan 2026)
   Catatan: setiap kueri dimuat dengan halaman bersih agar status tombol tidak terbawa. */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' }
const srv = createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0])
  let f = join('dist', p === '/' ? 'index.html' : p)
  if (!existsSync(f)) f = join('dist', 'index.html')
  r.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' })
  r.end(readFileSync(f))
})
await new Promise(r => srv.listen(4215, '0.0.0.0', r))
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 390, height: 844 } })
let l = 0, g = 0
const cek = (n, ok, d = '') => { ok ? l++ : g++; console.log(`  ${ok ? 'LULUS' : 'GAGAL'}  ${n}${d ? '  → ' + d : ''}`) }

/** Nomor pasal pada kartu hasil (tombol berteks persis "Pasal N") */
const daftarHasil = async () => await pg.locator('button').evaluateAll(els =>
  els.filter(e => /^Pasal \d+$/.test(e.textContent.trim()))
     .map(e => +e.textContent.trim().split(' ')[1]))

/** 54 pasal lama yang tersentuh UU 1/2026 — dari data, bukan dari ingatan */
const d = JSON.parse(readFileSync('src/data/kuhp-2026.json', 'utf8'))
const tersentuh = new Set(d.butir.flatMap(x => x.pasal).filter(p => /^\d+$/.test(p)).map(Number))

console.log('\n=== A. SARINGAN PENCARIAN 2026 ===')

await pg.goto('http://localhost:4215/#/cari?q=kesalahan'); await pg.waitForTimeout(900)
const s1 = await pg.locator('body').innerText()
cek('Tombol "Hanya yang diubah 2026" tampil', /Hanya yang diubah 2026/.test(s1))

await pg.locator('button', { hasText: 'Hanya yang diubah 2026' }).click(); await pg.waitForTimeout(600)
const s2 = await pg.locator('body').innerText()
cek('Banner penjelasan muncul', /Menampilkan hanya pasal yang disentuh/.test(s2))
cek('Banner tetap menyatakan naskah asli 2023', /naskah asli 2023/.test(s2))
cek('Banner menyebut UU No. 1 Tahun 2026', /UU No\. 1 Tahun 2026/.test(s2))
cek('Lencana perubahan tampil di kartu hasil', /(Diubah|Dihapus|Baru|Penjelasan) 2026/.test(s2))
cek('Reset mematikan saringan',
  await (async () => { await pg.locator('button', { hasText: /Reset/ }).first().click()
    await pg.waitForTimeout(400)
    return !/Menampilkan hanya pasal yang disentuh/.test(await pg.locator('body').innerText()) })())

// Tiap kueri: muat bersih, lalu bandingkan
console.log('\n=== A2. HASIL SARING SELALU SUBSET & SELALU TERSENTUH ===')
for (const q of ['kesalahan', 'narkotika', 'pencurian', 'pencemaran', 'pembunuhan']) {
  await pg.goto('http://localhost:4215/#/'); await pg.waitForTimeout(250)
  await pg.goto('http://localhost:4215/#/cari?q=' + encodeURIComponent(q)); await pg.waitForTimeout(850)
  const sebelum = await daftarHasil()
  await pg.locator('button', { hasText: 'Hanya yang diubah 2026' }).click(); await pg.waitForTimeout(550)
  const sesudah = await daftarHasil()
  const subset = sesudah.every(x => sebelum.includes(x))
  const semuaTersentuh = sesudah.every(x => tersentuh.has(x))
  cek(`"${q}": subset dari hasil asli`, subset, `${sebelum.length} → ${sesudah.length}`)
  cek(`"${q}": semua hasil benar-benar tersentuh`, semuaTersentuh,
    sesudah.length ? sesudah.join(',') : '(kosong — sah, tak ada yang tersentuh)')
}

console.log('\n=== B. EKSPOR MENCANTUMKAN PERUBAHAN 2026 ===')
await pg.goto('http://localhost:4215/#/ekspor'); await pg.waitForTimeout(900)
cek('Halaman ekspor terbuka', /Ekspor/.test(await pg.locator('body').innerText()))

// Bangun isi ekspor lewat modul yang sama dengan tombol ekspor
const mod = await import('/tmp/exp.mjs')
const txt = mod.bangunTeks([37, 79, 615])
console.log('\n--- cuplikan ekspor (pasal 37 diubah, 79 bersih, 615 dihapus) ---')
console.log(txt.split('\n').filter(x => /PERHATIAN|DIUBAH|DIHAPUS|Pasal (37|79|615)$/.test(x)).slice(0, 8)
  .map(x => '    ' + x).join('\n'))
cek('Header memuat peringatan jumlah pasal berubah', /PERHATIAN: 2 dari 3 pasal/.test(txt))
cek('Pasal 37 ditandai DIUBAH', /Pasal 37\n\[DIUBAH oleh UU No\. 1 Tahun 2026/.test(txt))
cek('Pasal 615 ditandai DIHAPUS', /Pasal 615\n\*\*\* PASAL INI DIHAPUS OLEH UU NO\. 1 TAHUN 2026/.test(txt))
cek('Pasal 79 TIDAK ditandai', /Pasal 79\n(?!\[DIUBAH|\*\*\*)/.test(txt))
cek('Menyebut rujukan LN 2026 No. 1', /LN Tahun 2026 Nomor 1/.test(txt))

const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
cek('Tanpa geser horizontal', ov <= 1, `${ov}px`)

console.log(`\n${'='.repeat(56)}\nTOTAL: ${l}/${l + g} lulus · ${g} gagal\n${'='.repeat(56)}`)
await b.close(); srv.close()
process.exit(g ? 1 : 0)
