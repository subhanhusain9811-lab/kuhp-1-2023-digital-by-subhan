import { chromium } from 'playwright'
const PORT = 4221
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 390, height: 844 } })
let lulus=0, gagal=0
const cek=(n,ok,extra='')=>{ ok?lulus++:gagal++; console.log(`  ${ok?'LULUS':'GAGAL'}  ${n}${extra?'  → '+extra:''}`) }

await pg.goto(`http://127.0.0.1:${PORT}/#/penyesuaian`)
await pg.waitForTimeout(1200)
const tab = pg.locator('button').filter({ hasText: /^Lampiran I · 186 UU$/ })
cek('Tab Lampiran I ada', await tab.count() === 1)
await tab.click()
await pg.waitForTimeout(700)

const body = await pg.locator('body').innerText()
cek('Menyebut 186 undang-undang', body.includes('186'))
cek('Menampilkan jumlah nomor terverifikasi', /terverifikasi/i.test(body))
cek('Menjelaskan lima status keterverifikasian', (body.match(/Terverifikasi|Dipulihkan|pembanding saja|Perlu diperiksa|tak terbaca/gi)||[]).length >= 2)
cek('Menyebut jumlah baris ketentuan', /1\.558/.test(body))
cek('Ada peringatan wajib cocokkan ke PDF', /wajib dicocokkan ke PDF/i.test(body))
cek('Menampilkan UU pertama (Agraria)', /Agraria/i.test(body))

const kartu = await pg.locator('button[aria-expanded]').count()
cek('Kartu entri tampil (25 pertama)', kartu === 25, `${kartu} kartu`)

await pg.locator('button[aria-expanded]').first().click()
await pg.waitForTimeout(400)
const isi = await pg.locator('body').innerText()
cek('Buka entri menampilkan pasal & ayat', /Pasal 52 ayat \(1\)/.test(isi))
cek('Menampilkan pembanding bukti kedua sumber', /Pembanding:/.test(isi) && /PDF \(jangkar\):/.test(isi))
cek('Menampilkan ancaman pidana', /kategori II/i.test(isi))

// pencarian
await pg.locator('input[aria-label="Cari di Lampiran I"]').fill('pajak')
await pg.waitForTimeout(500)
const n2 = await pg.locator('button[aria-expanded]').count()
cek('Pencarian menyaring hasil', n2 > 0 && n2 < 25, `${n2} hasil`)

// petunjuk arah saat kueri narkotika (memang tidak ada di Lampiran I)
await pg.locator('input[aria-label="Cari di Lampiran I"]').fill('narkotika')
await pg.waitForTimeout(500)
const b4 = await pg.locator('body').innerText()
cek('Kueri "narkotika" memberi petunjuk ke Lampiran II', /Lampiran II/.test(b4))

// saringan
await pg.locator('input[aria-label="Cari di Lampiran I"]').fill('')
await pg.waitForTimeout(400)
await pg.locator('button', { hasText: 'Perlu diperiksa' }).first().click()
await pg.waitForTimeout(500)
const body3 = await pg.locator('body').innerText()
cek('Saringan "Perlu dicek" bekerja', !/Nomor cocok dengan PDF/.test(body3))

// tanpa geser horizontal
const g = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
cek('Tanpa geser horizontal', g <= 0, `${g}px`)

// entri yang sudah dibaca manusia harus menampilkan lencana
// (kembalikan saringan ke "Semua" dulu — langkah sebelumnya menyaring ke "Perlu diperiksa")
await pg.locator('button').filter({ hasText: /^Semua 186$/ }).click()
await pg.waitForTimeout(400)
await pg.locator('input[aria-label="Cari di Lampiran I"]').fill('Perlindungan Konsumen')
await pg.waitForTimeout(500)
const b5 = await pg.locator('body').innerText()
cek('Entri hasil baca manusia diberi lencana', /dibaca manusia/i.test(b5))
cek('Nomor hasil koreksi manusia tampil (8 Tahun 1999)', /8 Tahun 1999/.test(b5))

await pg.locator('input[aria-label="Cari di Lampiran I"]').fill('Budi Daya Pertanian')
await pg.waitForTimeout(500)
const b6 = await pg.locator('body').innerText()
cek('Nomor hasil koreksi manusia tampil (22 Tahun 2019)', /22 Tahun 2019/.test(b6))

await b.close()
console.log(`\nTOTAL: ${lulus}/${lulus+gagal} lulus · ${gagal} gagal`)
process.exit(gagal?1:0)
