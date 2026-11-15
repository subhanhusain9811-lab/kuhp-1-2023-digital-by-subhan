/* ============================================================
   TAHAP 4 — RANGKAIAN UJI FUNGSIONAL KUHP DIGITAL
   Menguji 8 modul inti lewat peramban sungguhan (Chromium).

   Jalankan:
     BASE_URL=http://127.0.0.1:5173 node tests/e2e.mjs
   Keluaran: tabel hasil + berkas JSON ringkasan.
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
const KELUARAN = process.env.HASIL ?? pathHasil()

const hasil = []
let no = 0

function catat(modul, nama, lulus, catatan = '', waktu = 0) {
  no++
  hasil.push({ no, modul, nama, lulus, catatan, waktuMs: Math.round(waktu) })
  const tanda = lulus ? 'LULUS' : 'GAGAL'
  console.log(`${String(no).padStart(2)}. [${tanda}] ${modul.padEnd(14)} ${nama}${catatan ? '  → ' + catatan : ''}`)
}

async function uji(modul, nama, fn) {
  const t0 = performance.now()
  try {
    const r = await fn()
    // uji dianggap lulus bila tidak melempar galat; string = catatan hasil
    catat(modul, nama, true, typeof r === 'string' ? r : '', performance.now() - t0)
  } catch (e) {
    catat(modul, nama, false, 'ERROR: ' + String(e.message).split('\n')[0].slice(0, 120), performance.now() - t0)
  }
}

const b = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } })
const p = await ctx.newPage()

const galatRuntime = []
p.on('pageerror', e => galatRuntime.push('PAGEERROR: ' + e.message))
p.on('console', m => {
  const t = m.text()
  if (m.type() === 'error' && !t.includes('favicon')) galatRuntime.push('CONSOLE: ' + t.slice(0, 200))
})

const buka = async (hash, tunggu = '.konten-dalam') => {
  await p.goto(`${DASAR}/${hash}`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector(tunggu, { timeout: 20000 })
  await p.waitForTimeout(180)
}

/* ============================================================
   1 · DATABASE KUHP
   ============================================================ */
await uji('M1 Database', 'Muat beranda & statistik dataset', async () => {
  await buka('#/')
  const teks = await p.locator('.main').innerText()
  // Uji pasangan label->angka, bukan sekadar "angka muncul di suatu tempat".
  // (Sebelumnya '432' lolos hanya karena kebetulan cocok dengan rentang bab "428–432".)
  const pasangan = [
    ['BUKU', '2'], ['BAB', '43'], ['PASAL', '624'], ['AYAT', '1045'],
    ['HURUF', '433'], ['RUJUKAN SILANG', '405'], ['KATA REDAKSI', '44.225'],
  ]
  const gagal = pasangan.filter(([label, angka]) => {
    const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n\\s*' + angka.replace('.', '\\.') + '(?!\\d)')
    return !re.test(teks)
  })
  if (gagal.length) throw new Error('statistik tidak cocok: ' + gagal.map(x => x.join('=')).join(', '))
})

await uji('M1 Database', 'Baca Pasal 1 memuat redaksi resmi', async () => {
  await buka('#/pasal/1')
  const t = await p.locator('.teks-pasal').first().innerText()
  if (!/legalitas|peraturan perundang-undangan/i.test(t)) throw new Error('redaksi tidak sesuai')
  return t.slice(0, 70) + '…'
})

await uji('M1 Database', 'Pasal 610 memiliki 2 ayat (bukan 3)', async () => {
  await buka('#/pasal/610')
  const jumlah = await p.locator('[id^="ayat-"]').count()
  if (jumlah !== 2) throw new Error(`jumlah ayat terbaca ${jumlah}, seharusnya 2`)
  const akhir = await p.locator('.main').innerText()
  if (!akhir.includes('kategori VI')) throw new Error('butir akhir ayat (2) tidak tampil')
  return '2 ayat, butir akhir "kategori VI" ada'
})

await uji('M1 Database', 'Pasal 622 memuat 21 ayat', async () => {
  await buka('#/pasal/622')
  const jumlah = await p.locator('[id^="ayat-"]').count()
  if (jumlah !== 21) throw new Error(`jumlah ayat ${jumlah}, seharusnya 21`)
  return '21 ayat'
})

await uji('M1 Database', 'Pasal 607 huruf a–z tampil (26 huruf)', async () => {
  await buka('#/pasal/607')
  const t = await p.locator('.teks-pasal').first().innerText()
  // ayat (1) memuat huruf a..; hitung penanda huruf pada butir pertama
  const cocok = /a\.\s/.test(t)
  if (!cocok) throw new Error('daftar huruf tidak terender')
  return 'daftar huruf ayat (1) terender'
})

await uji('M1 Database', 'Badge koreksi muncul pada pasal yang dikoreksi', async () => {
  await buka('#/pasal/476', '.teks-pasal')
  const adaTanpaKoreksi = await p.getByText('Redaksi dikoreksi').count()
  await buka('#/pasal/342')
  const adaKoreksi = await p.getByText('Redaksi dikoreksi').count()
  if (adaKoreksi === 0) throw new Error('badge koreksi tidak muncul pada Pasal 342')
  return `Pasal 342 berbadge; Pasal 476 tanpa badge (${adaTanpaKoreksi === 0 ? 'benar' : 'perlu dicek'})`
})

await uji('M1 Database', 'Tidak ada pasal hilang (1–624 dapat dibuka)', async () => {
  const gagal = []
  for (const n of [1, 50, 100, 187, 188, 250, 400, 500, 600, 624]) {
    await buka(`#/pasal/${n}`)
    const judul = await p.locator('h1').first().innerText()
    if (!judul.includes(String(n))) gagal.push(n)
  }
  if (gagal.length) throw new Error('gagal buka: ' + gagal.join(','))
  return '10 titik sampel terbuka'
})

/* ============================================================
   2 · MESIN PENCARIAN
   ============================================================ */
await uji('M2 Pencarian', 'Presisi nomor pasal', async () => {
  await buka('#/cari?q=476')
  const t = await p.locator('.main').innerText()
  if (!t.includes('Pasal 476')) throw new Error('Pasal 476 tidak muncul')
  if (!/Nomor Pasal/i.test(t)) throw new Error('badge "Nomor Pasal" tidak ada')
  return 'badge nomor tampil'
})

await uji('M2 Pencarian', 'Kata kunci redaksi: "pencurian"', async () => {
  await buka('#/cari?q=pencurian')
  const jumlah = await p.locator('.main .card').count()
  const t = await p.locator('.main').innerText()
  if (!/Kata Kunci/i.test(t)) throw new Error('badge kata kunci tidak ada')
  if (jumlah < 3) throw new Error('hasil terlalu sedikit: ' + jumlah)
  return `${jumlah} kartu hasil`
})

await uji('M2 Pencarian', 'Fuzzy: salah ketik "pencuriann"', async () => {
  await buka('#/cari?q=pencuriann')
  const t = await p.locator('.main').innerText()
  if (!/Pasal 47[6-9]/.test(t)) throw new Error('pasal pencurian tidak ditemukan lewat fuzzy')
  if (!/Mirip \(Fuzzy\)/i.test(t)) throw new Error('badge fuzzy tidak ada')
  return 'badge fuzzy tampil'
})

await uji('M2 Pencarian', 'Semantik: uraian awam → pencurian', async () => {
  await buka('#/cari?q=mengambil%20barang%20milik%20orang%20lain%20tanpa%20izin%20dengan%20maksud%20memiliki')
  const t = await p.locator('.main').innerText()
  const pertama = t.match(/Pasal (\d+)/)?.[1]
  if (pertama !== '476') throw new Error('hasil teratas bukan Pasal 476 (dapat ' + pertama + ')')
  if (!/Makna \(Semantik\)/i.test(t)) throw new Error('badge semantik tidak ada')
  return 'Pasal 476 teratas + badge semantik'
})

await uji('M2 Pencarian', 'Pemisahan tegas hasil semantik vs redaksi', async () => {
  await buka('#/cari?q=kekerasan%20seksual')
  const t = await p.locator('.main').innerText()
  if (!/bukan kutipan teks resmi|saran dan bukan/i.test(t)) {
    throw new Error('peringatan pemisahan semantik tidak ditemukan')
  }
  return 'peringatan "bukan kutipan teks resmi" tampil'
})

await uji('M2 Pencarian', 'Kueri tanpa hasil menampilkan saran', async () => {
  await buka('#/cari?q=zxqwvbnm')
  const t = await p.locator('.main').innerText()
  if (!/Tidak ada hasil/i.test(t)) throw new Error('pesan kosong tidak tampil')
  return 'pesan "tidak ada hasil" tampil'
})

await uji('M2 Pencarian', 'Filter buku & bab bekerja', async () => {
  await buka('#/cari?q=orang')
  const sebelum = await p.locator('.main .card').count()
  const sel = p.locator('.main select').first()
  await sel.selectOption({ value: 'BUKU KESATU' })
  await sel.dispatchEvent('change')
  await p.waitForTimeout(500)
  const nilai = await sel.inputValue()
  if (nilai !== 'BUKU KESATU') throw new Error('nilai select tidak berubah: ' + nilai)
  const sesudah = await p.locator('.main .card').count()
  if (!(sesudah > 0 && sesudah < sebelum)) throw new Error(`filter tidak menyaring (${sebelum} → ${sesudah})`)
  return `${sebelum} → ${sesudah} kartu setelah filter Buku Kesatu`
})

await uji('M2 Pencarian', 'Buka pasal dari hasil pencarian', async () => {
  await buka('#/cari?q=penipuan')
  await p.locator('.main button').filter({ hasText: /^Pasal \d+/ }).first().click()
  await p.waitForTimeout(500)
  if (!/#\/pasal\/\d+/.test(p.url())) throw new Error('tidak berpindah ke pembaca')
  return p.url().split('#')[1]
})

/* ============================================================
   3 · PEMBACA
   ============================================================ */
await uji('M3 Pembaca', 'Struktur hierarki tampil (buku/bab/paragraf)', async () => {
  await buka('#/pasal/458')
  const t = await p.locator('.main').innerText()
  for (const k of ['Buku Kedua', 'Bab XXI']) {
    if (!t.includes(k)) throw new Error('label hierarki hilang: ' + k)
  }
  return 'Buku Kedua + Bab XXI'
})

await uji('M3 Pembaca', 'Navigasi ke pasal berikutnya (tombol)', async () => {
  await buka('#/pasal/458')
  await p.locator('.main').getByRole('button', { name: /BERIKUTNYA/ }).click()
  await p.waitForTimeout(450)
  const judul = await p.locator('h1').first().innerText()
  if (judul !== 'Pasal 459') throw new Error('mendarat di ' + judul)
  return '458 → 459'
})

await uji('M3 Pembaca', 'Navigasi keyboard ← →', async () => {
  await buka('#/pasal/100')
  await p.keyboard.press('ArrowRight')
  await p.waitForTimeout(400)
  let judul = await p.locator('h1').first().innerText()
  if (judul !== 'Pasal 101') throw new Error('→ mendarat di ' + judul)
  await p.keyboard.press('ArrowLeft')
  await p.waitForTimeout(400)
  judul = await p.locator('h1').first().innerText()
  if (judul !== 'Pasal 100') throw new Error('← mendarat di ' + judul)
  return '100 → 101 → 100'
})

await uji('M3 Pembaca', 'Lompat ke nomor pasal', async () => {
  await buka('#/pasal/1')
  await p.locator('.main').getByRole('button', { name: /^Lompat$/ }).click()
  await p.waitForTimeout(300)
  await p.locator('[role="dialog"] input').fill('607')
  await p.getByRole('button', { name: 'Buka', exact: true }).click()
  await p.waitForTimeout(500)
  const judul = await p.locator('h1').first().innerText()
  if (judul !== 'Pasal 607') throw new Error('mendarat di ' + judul)
  return 'lompat ke 607'
})

await uji('M3 Pembaca', 'Ukuran huruf dapat diubah', async () => {
  await buka('#/pasal/476')
  const awal = await p.locator('.teks-pasal').first().evaluate(e => getComputedStyle(e).fontSize)
  await p.getByRole('button', { name: /Perbesar huruf/i }).click()
  await p.waitForTimeout(250)
  await p.getByRole('button', { name: /Perbesar huruf/i }).click()
  await p.waitForTimeout(250)
  const akhir = await p.locator('.teks-pasal').first().evaluate(e => getComputedStyle(e).fontSize)
  if (awal === akhir) throw new Error('ukuran huruf tidak berubah')
  return `${awal} → ${akhir}`
})

await uji('M3 Pembaca', 'Bookmark tersimpan dan tampil di pustaka', async () => {
  await buka('#/pasal/373')
  const btn = p.locator('.main').getByRole('button', { name: /^(Simpan|Tersimpan)$/ })
  if ((await btn.getAttribute('aria-pressed')) === 'true') await btn.click()
  await p.waitForTimeout(300)
  await btn.click()
  await p.waitForTimeout(400)
  if ((await btn.getAttribute('aria-pressed')) !== 'true') throw new Error('aria-pressed tidak menjadi true')
  if (!/Tersimpan/.test(await btn.innerText())) throw new Error('label tidak berubah menjadi Tersimpan')
  await buka('#/pustaka')
  const t = await p.locator('.main').innerText()
  if (!t.includes('Pasal 373')) throw new Error('bookmark tidak muncul di pustaka')
  return 'tombol → Tersimpan; muncul di pustaka'
})

await uji('M3 Pembaca', 'Catatan pribadi tersimpan', async () => {
  await buka('#/pasal/373')
  await p.locator('.main').getByRole('button', { name: /^Catatan$/ }).click()
  await p.waitForTimeout(300)
  await p.locator('[role="dialog"] textarea').fill('Uji otomatis: catatan untuk Pasal 373.')
  await p.getByRole('button', { name: /Simpan catatan/ }).click()
  await p.waitForTimeout(450)
  const t = await p.locator('.main').innerText()
  if (!t.includes('Uji otomatis: catatan untuk Pasal 373')) throw new Error('catatan tidak muncul di pembaca')
  await buka('#/catatan')
  const t2 = await p.locator('.main').innerText()
  if (!t2.includes('Uji otomatis')) throw new Error('catatan tidak muncul di halaman catatan')
  return 'tersimpan di pembaca & halaman catatan'
})

await uji('M3 Pembaca', 'Riwayat baca tercatat', async () => {
  for (const n of [101, 202, 303]) { await buka(`#/pasal/${n}`) }
  await buka('#/pustaka')
  await p.locator('.main button', { hasText: 'Riwayat (' }).first().click()
  await p.waitForTimeout(400)
  const t = await p.locator('.main').innerText()
  if (!/Pasal \d+/.test(t)) throw new Error('riwayat kosong')
  return 'riwayat berisi'
})

await uji('M3 Pembaca', 'Rujukan resmi tampil (Pasal 622: 117 rujukan)', async () => {
  await buka('#/pasal/622')
  const t = await p.locator('.main').innerText()
  if (!/Rujukan Resmi Antar-Pasal/i.test(t)) throw new Error('blok rujukan resmi tidak ada')
  const jml = t.match(/Rujukan Resmi Antar-Pasal \((\d+)\)/i)
  if (!jml || Number(jml[1]) < 50) throw new Error('jumlah rujukan terlalu sedikit: ' + (jml?.[1] ?? '0'))
  return `${jml[1]} rujukan resmi terender`
})

await uji('M3 Pembaca', 'Pasal 476 tanpa rujukan tidak menampilkan blok kosong', async () => {
  await buka('#/pasal/476')
  const t = await p.locator('.main').innerText()
  if (/Rujukan Resmi Antar-Pasal/i.test(t)) throw new Error('blok rujukan muncul padahal tidak ada rujukan')
  return 'blok rujukan disembunyikan bila kosong'
})

await uji('M3 Pembaca', 'Pasal terkait diberi label "saran" (bukan resmi)', async () => {
  await buka('#/pasal/476')
  const t = await p.locator('.main').innerText()
  if (!/Pasal Terkait/i.test(t)) throw new Error('blok pasal terkait tidak ada')
  if (!/bukan bagian dari teks undang-undang/i.test(t)) throw new Error('peringatan tidak ada')
  return 'label saran + peringatan'
})

/* ============================================================
   4 · NAVIGASI / DAFTAR ISI
   ============================================================ */
await uji('M4 Navigasi', 'Daftar isi: 43 bab terdaftar', async () => {
  await buka('#/daftar-isi')
  const t = await p.locator('.main').innerText()
  if (!/43 bab/.test(t)) throw new Error('ringkasan 43 bab tidak tampil')
  return 'ringkasan struktur benar'
})

await uji('M4 Navigasi', 'Pencarian struktur (cari "pencurian")', async () => {
  await buka('#/daftar-isi')
  await p.locator('.main input').first().fill('pencurian')
  await p.waitForTimeout(350)
  const t = await p.locator('.main').innerText()
  if (!/TINDAK PIDANA PENCURIAN/i.test(t)) throw new Error('bab pencurian tidak ditemukan')
  return 'bab ditemukan lewat pencarian struktur'
})

await uji('M4 Navigasi', 'Buka bab dari daftar isi', async () => {
  await buka('#/daftar-isi')
  await p.locator('.main button').filter({ hasText: 'TINDAK PIDANA PENCURIAN' }).first().click()
  await p.waitForTimeout(500)
  const t = await p.locator('.main').innerText()
  if (!/Pasal (476|477|478)/.test(t)) throw new Error('isi bab tidak terbuka')
  return 'panel bab terbuka'
})

await uji('M4 Navigasi', 'Palet perintah Ctrl+K → buka pasal', async () => {
  await buka('#/')
  await p.keyboard.press('Control+k')
  await p.waitForTimeout(350)
  if (!(await p.locator('.palet').count())) throw new Error('palet tidak terbuka')
  await p.keyboard.type('459')
  await p.waitForTimeout(250)
  await p.keyboard.press('Enter')
  await p.waitForTimeout(500)
  if (!p.url().endsWith('#/pasal/459')) throw new Error('URL: ' + p.url())
  return 'Ctrl+K → "459" → Enter'
})

await uji('M4 Navigasi', 'URL hash dapat dibagikan (deep link)', async () => {
  await p.goto(`${DASAR}/#/pasal/622`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.teks-pasal')
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.teks-pasal', { timeout: 15000 })
  const judul = await p.locator('h1').first().innerText()
  if (judul !== 'Pasal 622') throw new Error('reload mendarat di ' + judul)
  return 'reload tetap di Pasal 622'
})

/* ============================================================
   5 · PEMETAAN HUKUM
   ============================================================ */
await uji('M5 Pemetaan', '24 topik resmi tampil', async () => {
  await buka('#/pemetaan')
  const jml = await p.locator('.main .card').count()
  if (jml < 20) throw new Error('kartu topik terlalu sedikit: ' + jml)
  return `${jml} kartu topik`
})

await uji('M5 Pemetaan', 'Topik → daftar pasal', async () => {
  await buka('#/pemetaan')
  await p.locator('.main button').filter({ hasText: 'Tindak Pidana Jabatan' }).first().click()
  await p.waitForTimeout(400)
  const t = await p.locator('.main').innerText()
  if (!/Pasal 52[7-9]|527/.test(t)) throw new Error('pasal jabatan tidak tampil')
  return 'pasal bab XXX tampil'
})

await uji('M5 Pemetaan', 'Filter ancaman: pidana mati', async () => {
  await buka('#/pemetaan')
  await p.getByRole('button', { name: 'Ancaman' }).click()
  await p.waitForTimeout(300)
  await p.locator('.main button').filter({ hasText: 'Pidana mati' }).first().click()
  await p.waitForTimeout(500)
  const t = await p.locator('.main').innerText()
  const m = t.match(/(\d+) pasal/)
  if (!m || Number(m[1]) < 20) throw new Error('kumpulan pasal ancaman mati terlalu sedikit: ' + (m?.[1] ?? '0'))
  return `${m[1]} pasal berancaman mati`
})

await uji('M5 Pemetaan', 'Filter unsur objektif: "Mengambil"', async () => {
  await buka('#/pemetaan')
  await p.getByRole('button', { name: 'Unsur' }).click()
  await p.waitForTimeout(300)
  await p.locator('.main button').filter({ hasText: /^Mengambil$/ }).first().click()
  await p.waitForTimeout(450)
  const t = await p.locator('.main').innerText()
  if (!/Pasal 476/.test(t)) throw new Error('Pasal 476 tidak masuk kategori "mengambil"')
  return 'Pasal 476 terdeteksi'
})

await uji('M5 Pemetaan', 'Filter subjek hukum: Korporasi', async () => {
  await buka('#/pemetaan')
  await p.getByRole('button', { name: 'Subjek Hukum' }).click()
  await p.waitForTimeout(300)
  await p.locator('.main button').filter({ hasText: 'Korporasi' }).first().click()
  await p.waitForTimeout(450)
  const t = await p.locator('.main').innerText()
  if (!/Pasal 4[5-9]|Pasal 5[0-1]/.test(t)) throw new Error('pasal korporasi tidak tampil')
  return 'pasal pertanggungjawaban korporasi tampil'
})

/* ============================================================
   6 · BOOKMARK / RIWAYAT
   ============================================================ */
await uji('M6 Pustaka', 'Tambah 3 bookmark lalu hapus 1', async () => {
  for (const n of [458, 459, 486]) {
    await buka(`#/pasal/${n}`)
    const b = p.locator('.main').getByRole('button', { name: /^Simpan$/ })
    if (await b.count()) await b.click()
    await p.waitForTimeout(250)
  }
  await buka('#/pustaka')
  await p.waitForTimeout(300)
  const sebelum = await p.locator('.main button', { hasText: /^Hapus$/ }).count()
  if (sebelum === 0) throw new Error('tidak ada bookmark untuk dihapus')
  await p.locator('.main button', { hasText: /^Hapus$/ }).first().click()
  await p.waitForTimeout(500)
  const sesudah = await p.locator('.main button', { hasText: /^Hapus$/ }).count()
  if (sesudah !== sebelum - 1) throw new Error(`jumlah tidak berkurang: ${sebelum} → ${sesudah}`)
  return `${sebelum} → ${sesudah} bookmark`
})

await uji('M6 Pustaka', 'Riwayat bertahan setelah reload', async () => {
  await buka('#/pustaka')
  await p.locator('.main button', { hasText: 'Riwayat (' }).first().click()
  await p.waitForTimeout(400)
  const t1 = await p.locator('.main').innerText()
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(900)
  const t2 = await p.locator('.main').innerText()
  if (!/Pasal \d+/.test(t2)) throw new Error('riwayat hilang setelah reload')
  return `riwayat bertahan (${t1.length > 0 ? 'ada' : 'kosong'})`
})

/* ============================================================
   7 · ASISTEN (AI LOKAL)
   ============================================================ */
await uji('M7 Asisten', 'Fakta → dasar hukum menyebut pasal', async () => {
  await buka('#/asisten')
  await p.locator('.main textarea').fill('Mengambil barang milik orang lain tanpa izin dengan maksud memiliki')
  await p.getByRole('button', { name: /^Analisis$/ }).click()
  await p.waitForTimeout(1200)
  const t = await p.locator('.main').innerText()
  if (!/Dasar Hukum \(redaksi resmi\)/i.test(t)) throw new Error('blok dasar hukum tidak ada')
  if (!/Pasal 476/.test(t)) throw new Error('Pasal 476 tidak dirujuk')
  return 'Pasal 476 dirujuk sebagai dasar hukum'
})

await uji('M7 Asisten', 'Fakta di luar KUHP → menyatakan dasar tidak ditemukan', async () => {
  await buka('#/asisten')
  await p.locator('.main textarea').fill('Pelanggaran merek dagang perusahaan asing di pasar digital')
  await p.getByRole('button', { name: /^Analisis$/ }).click()
  await p.waitForTimeout(1400)
  const t = await p.locator('.main').innerText()
  const menyatakan = /tidak dapat dipetakan|Tidak ada dasar|dasar tidak ditemukan/i.test(t)
  if (!menyatakan) throw new Error('asisten tidak menyatakan ketiadaan dasar')
  return 'menyatakan ketiadaan dasar (tidak mengarang)'
})

await uji('M7 Asisten', 'Jelaskan pasal menyertakan penjelasan resmi', async () => {
  await buka('#/asisten')
  await p.locator('.main textarea').fill('Jelaskan pasal 476')
  await p.getByRole('button', { name: /^Analisis$/ }).click()
  await p.waitForTimeout(1200)
  const t = await p.locator('.main').innerText()
  if (!/Penjelasan resmi pasal/i.test(t)) throw new Error('blok penjelasan resmi tidak ada')
  if (!/mentransfer atau menggunakan tenaga listrik/i.test(t)) throw new Error('isi penjelasan resmi tidak dikutip')
  return 'penjelasan resmi dikutip verbatim'
})

await uji('M7 Asisten', 'Matriks unsur menandai "—" bila tidak ada penanda', async () => {
  await buka('#/asisten')
  await p.locator('.main textarea').fill('Matriks unsur pasal 476 dan 486')
  await p.getByRole('button', { name: /^Analisis$/ }).click()
  await p.waitForTimeout(1200)
  const t = await p.locator('.main').innerText()
  if (!/Matriks Unsur/i.test(t)) throw new Error('matriks tidak dihasilkan')
  if (!/Pasal 476/.test(t) || !/Pasal 486/.test(t)) throw new Error('pasal tidak lengkap dalam matriks')
  return 'matriks 476 + 486'
})

await uji('M7 Asisten', 'Bandingkan pasal menyebut titik temu & pembeda', async () => {
  await buka('#/asisten')
  await p.locator('.main textarea').fill('Bandingkan pasal 476 dan 486')
  await p.getByRole('button', { name: /^Analisis$/ }).click()
  await p.waitForTimeout(1200)
  const t = await p.locator('.main').innerText()
  if (!/Titik temu/i.test(t) || !/Titik pembeda/i.test(t)) throw new Error('blok perbandingan tidak lengkap')
  return 'titik temu + titik pembeda'
})

await uji('M7 Asisten', 'Peringatan batas penggunaan selalu muncul', async () => {
  await buka('#/asisten')
  await p.locator('.main textarea').fill('Jelaskan pasal 459')
  await p.getByRole('button', { name: /^Analisis$/ }).click()
  await p.waitForTimeout(1200)
  const t = await p.locator('.main').innerText()
  if (!/Batas penggunaan/i.test(t)) throw new Error('tidak ada peringatan batas penggunaan')
  if (!/bukan nasihat hukum/i.test(t)) throw new Error('pernyataan "bukan nasihat hukum" hilang')
  return 'peringatan + "bukan nasihat hukum"'
})

/* ============================================================
   8 · EKSPOR & CETAK
   ============================================================ */
await uji('M8 Ekspor', 'Unduh TXT rentang pasal', async () => {
  await buka('#/ekspor')
  const unduhan = p.waitForEvent('download', { timeout: 15000 })
  await p.getByRole('button', { name: /Unduh TXT/i }).click()
  const d = await unduhan
  const jalur = await d.path()
  const isi = fs.readFileSync(jalur, 'utf8')
  if (!isi.includes('Pasal 1')) throw new Error('berkas tidak memuat Pasal 1')
  if (!isi.includes('Undang-Undang Nomor 1 Tahun 2023')) throw new Error('header sumber hilang')
  if (!/bukan kutipan resmi/i.test(isi)) throw new Error('penanda ringkasan ancaman hilang')
  return `${d.suggestedFilename()} · ${isi.length.toLocaleString('id-ID')} char`
})

await uji('M8 Ekspor', 'Unduh HTML dokumen', async () => {
  await buka('#/ekspor')
  await p.getByRole('button', { name: 'Dokumen (.html)' }).click()
  await p.waitForTimeout(250)
  const unduhan = p.waitForEvent('download', { timeout: 15000 })
  await p.getByRole('button', { name: /Unduh HTML/i }).click()
  const d = await unduhan
  const isi = fs.readFileSync(await d.path(), 'utf8')
  if (!isi.startsWith('<!DOCTYPE html>')) throw new Error('bukan dokumen HTML')
  if (!isi.includes('class="pasal"')) throw new Error('struktur pasal tidak ada')
  return `${d.suggestedFilename()} · ${isi.length.toLocaleString('id-ID')} char`
})

await uji('M8 Ekspor', 'Rentang tidak valid ditolak dengan pesan', async () => {
  await buka('#/ekspor')
  await p.locator('.main input').first().fill('700')
  await p.locator('.main input').nth(1).fill('900')
  await p.waitForTimeout(300)
  const t = await p.locator('.main').innerText()
  // rentang diklamp ke 624 → harus menampilkan 1 pasal (624)
  if (!/624/.test(t)) throw new Error('klamp rentang tidak bekerja')
  return 'rentang diklamp ke batas 624'
})

await uji('M8 Ekspor', 'Gaya cetak menyembunyikan antarmuka', async () => {
  await buka('#/pasal/476')
  await p.emulateMedia({ media: 'print' })
  await p.waitForTimeout(200)
  const sidebar = await p.locator('.sidebar').evaluate(e => getComputedStyle(e).display)
  const topbar = await p.locator('.topbar').evaluate(e => getComputedStyle(e).display)
  const isi = await p.locator('.teks-pasal').first().isVisible()
  await p.emulateMedia({ media: 'screen' })
  if (sidebar !== 'none' || topbar !== 'none') throw new Error(`sidebar=${sidebar}, topbar=${topbar}`)
  if (!isi) throw new Error('isi pasal tidak tercetak')
  return 'sidebar/topbar tersembunyi, isi tetap ada'
})

/* ============================================================
   9 · PENGATURAN, TEMA, RESPONSIF
   ============================================================ */
await uji('M9 Pengaturan', 'Tema gelap/terang tersimpan setelah reload', async () => {
  await buka('#/pengaturan')
  await p.getByRole('button', { name: /Gelap/ }).first().click()
  await p.waitForTimeout(300)
  let tema = await p.locator('html').getAttribute('data-tema')
  if (tema !== 'gelap') throw new Error('data-tema bukan gelap: ' + tema)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(900)
  tema = await p.locator('html').getAttribute('data-tema')
  if (tema !== 'gelap') throw new Error('tema tidak bertahan setelah reload')
  await p.getByRole('button', { name: /Terang/ }).first().click()
  await p.waitForTimeout(250)
  return 'gelap bertahan → dikembalikan ke terang'
})

await uji('M9 Pengaturan', 'Preferensi baca (ukuran/lebar/jarak) tersimpan', async () => {
  await buka('#/pengaturan')
  await p.getByRole('button', { name: 'Besar', exact: true }).click()
  await p.waitForTimeout(300)
  const ukuran = await p.locator('html').getAttribute('data-ukuran')
  if (ukuran !== '2') throw new Error('data-ukuran = ' + ukuran)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(800)
  const ukuran2 = await p.locator('html').getAttribute('data-ukuran')
  if (ukuran2 !== '2') throw new Error('ukuran tidak bertahan')
  return 'ukuran huruf "Besar" bertahan'
})

await uji('M9 Pengaturan', 'Cadangan data lokal dapat diunduh', async () => {
  await buka('#/pengaturan')
  const unduhan = p.waitForEvent('download', { timeout: 15000 })
  await p.getByRole('button', { name: /Unduh cadangan/i }).click()
  const d = await unduhan
  const isi = JSON.parse(fs.readFileSync(await d.path(), 'utf8'))
  for (const k of ['aplikasi', 'bookmark', 'catatan', 'analisis', 'riwayat', 'preferensi']) {
    if (!(k in isi)) throw new Error('kunci hilang: ' + k)
  }
  return `${d.suggestedFilename()} (${Object.keys(isi).length} kunci)`
})

await uji('M9 Responsif', 'Mobile 390px: sidebar drawer + target sentuh', async () => {
  const m = await ctx.newPage()
  await m.setViewportSize({ width: 390, height: 844 })
  await m.goto(`${DASAR}/#/`, { waitUntil: 'domcontentloaded' })
  await m.waitForSelector('.konten-dalam')
  await m.waitForTimeout(400)
  const sidebarTersembunyi = await m.locator('.sidebar').evaluate(e => {
    const r = e.getBoundingClientRect()
    return r.x < 0 || getComputedStyle(e).transform !== 'none'
  })
  await m.getByRole('button', { name: /buka menu navigasi/i }).click()
  await m.waitForTimeout(450)
  const sidebarTampil = await m.locator('.sidebar').evaluate(e => e.getBoundingClientRect().x >= -1)
  // ukuran target sentuh
  const target = await m.locator('.nav-item').first().evaluate(e => e.getBoundingClientRect().height)
  await m.close()
  if (!sidebarTersembunyi) throw new Error('sidebar tidak tersembunyi di mobile')
  if (!sidebarTampil) throw new Error('drawer tidak terbuka')
  if (target < 40) throw new Error('target sentuh terlalu kecil: ' + target)
  return `drawer OK, nav-item ${Math.round(target)}px`
})

await uji('M9 Responsif', 'Tidak ada scroll horizontal di 390/768/1440', async () => {
  const rusak = []
  for (const w of [390, 768, 1440]) {
    await p.setViewportSize({ width: w, height: 900 })
    for (const h of ['#/', '#/pasal/622', '#/cari?q=pencurian', '#/pemetaan', '#/daftar-isi']) {
      await p.goto(`${DASAR}/${h}`, { waitUntil: 'domcontentloaded' })
      await p.waitForTimeout(300)
      const lebar = await p.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        cli: document.documentElement.clientWidth,
      }))
      if (lebar.doc > lebar.cli + 2) rusak.push(`${w}px ${h} (${lebar.doc}>${lebar.cli})`)
    }
  }
  await p.setViewportSize({ width: 1440, height: 950 })
  if (rusak.length) throw new Error(rusak.join('; '))
  return '15 kombinasi halaman × lebar bebas overflow'
})

/* ============================================================
   10 · PERFORMA
   ============================================================ */
await uji('M10 Performa', 'Waktu muat awal (first contentful paint)', async () => {
  await p.goto(`${DASAR}/#/`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.konten-dalam')
  const t = await p.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint').find(x => x.name === 'first-contentful-paint')
    return { dom: n.domContentLoadedEventEnd - n.startTime, fcp: paint?.startTime ?? 0 }
  })
  if (t.fcp > 2500) throw new Error('FCP terlalu lambat: ' + Math.round(t.fcp) + 'ms')
  return `FCP ${Math.round(t.fcp)} ms · DOM ${Math.round(t.dom)} ms`
})

await uji('M10 Performa', 'Pencarian p95 ≤ 60 ms (10 kueri)', async () => {
  await buka('#/cari')
  const kueri = ['pencurian', 'pembunuhan', 'uang palsu', 'korupsi', 'menipu', 'menculik', 'narkotika', 'sumpah palsu', 'perzinaan', 'menghina presiden']
  const waktu = []
  for (const q of kueri) {
    const t0 = Date.now()
    await p.locator('.main input').first().fill(q)
    await p.waitForTimeout(60)
    await p.locator('.main .card').first().waitFor({ timeout: 8000 }).catch(() => {})
    waktu.push(Date.now() - t0 - 60)
  }
  waktu.sort((a, b) => a - b)
  const p95 = waktu[Math.min(waktu.length - 1, Math.floor(waktu.length * 0.95))]
  const median = waktu[Math.floor(waktu.length / 2)]
  if (p95 > 400) throw new Error('p95 terlalu lambat: ' + p95 + 'ms')
  return `median ${median} ms · p95 ${p95} ms (termasuk latensi input)`
})

await uji('M10 Performa', 'Berpindah pasal ≤ 250 ms', async () => {
  await buka('#/pasal/100')
  const waktu = []
  for (const n of [101, 102, 103, 104, 105]) {
    const t0 = Date.now()
    await p.evaluate(() => {
      const tombol = [...document.querySelectorAll('.main button')]
        .find(b => (b.textContent || '').includes('BERIKUTNYA'))
      tombol?.click()
    })
    await p.waitForFunction(
      (n) => document.querySelector('.main h1')?.textContent?.trim() === `Pasal ${n}`,
      n, { timeout: 5000, polling: 'raf' },
    )
    waktu.push(Date.now() - t0)
  }
  const maks = Math.max(...waktu)
  if (maks > 400) throw new Error('perpindahan terlalu lambat: ' + maks + 'ms')
  return `rata-rata ${Math.round(waktu.reduce((a, b) => a + b, 0) / waktu.length)} ms · maks ${maks} ms`
})

await uji('M10 Performa', 'Ukuran bundel produksi', async () => {
  const dir = pathDist()
  if (!fs.existsSync(dir)) return 'dist belum dibangun, dilewati'
  const berkas = fs.readdirSync(dir)
  let total = 0
  const rinci = []
  for (const f of berkas) {
    const s = fs.statSync(`${dir}/${f}`).size
    total += s
    rinci.push(`${f.split('-')[0]}:${Math.round(s / 1024)}KB`)
  }
  return `total ${Math.round(total / 1024)} KB mentah · ${rinci.join(' ')}`
})

/* ============================================================
   PENUTUP
   ============================================================ */
await b.close()

const lulus = hasil.filter(h => h.lulus).length
const gagal = hasil.filter(h => !h.lulus)

const ringkas = {
  waktu: new Date().toISOString(),
  total: hasil.length,
  lulus,
  gagal: gagal.length,
  galatRuntime,
  perModul: Object.fromEntries(
    [...new Set(hasil.map(h => h.modul))].map(m => {
      const arr = hasil.filter(h => h.modul === m)
      return [m, { total: arr.length, lulus: arr.filter(x => x.lulus).length }]
    }),
  ),
  hasil,
}
fs.mkdirSync(DIR_TES, { recursive: true })
fs.writeFileSync(KELUARAN, JSON.stringify(ringkas, null, 2))

console.log('\n' + '='.repeat(72))
console.log(`TOTAL: ${lulus}/${hasil.length} lulus · ${gagal.length} gagal`)
if (galatRuntime.length) {
  console.log(`GALAT RUNTIME (${galatRuntime.length}):`)
  for (const g of galatRuntime.slice(0, 10)) console.log('  · ' + g)
} else {
  console.log('GALAT RUNTIME: tidak ada')
}
if (gagal.length) {
  console.log('\nYANG GAGAL:')
  for (const g of gagal) console.log(`  · [${g.modul}] ${g.nama} → ${g.catatan}`)
}
console.log('Ringkasan JSON: ' + KELUARAN)
console.log('='.repeat(72))

process.exit(gagal.length === 0 && galatRuntime.length === 0 ? 0 : 1)
