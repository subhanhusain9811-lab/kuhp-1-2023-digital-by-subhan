/* Uji browser: lapisan UU 1/2026 tampil benar & naskah asli utuh */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' }
const srv = createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0])
  let f = join('dist', p === '/' ? 'index.html' : p)
  if (!existsSync(f)) f = join('dist','index.html')
  res.writeHead(200,{'Content-Type': MIME[extname(f)] || 'application/octet-stream'})
  res.end(readFileSync(f))
})
await new Promise(r => srv.listen(4199,'0.0.0.0',r))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
let lulus=0, gagal=0
const cek=(n,ok,d='')=>{ ok?lulus++:gagal++; console.log(`  ${ok?'LULUS':'GAGAL'}  ${n}${d?'  → '+d:''}`) }

const dasar='http://localhost:4199/'

console.log('\n=== UJI BROWSER 390×844 (ponsel) ===')

// --- 1. Halaman penyesuaian ---
await page.goto(dasar+'#/penyesuaian'); await page.waitForTimeout(700)
const h1 = await page.locator('h1').first().innerText()
cek('Halaman UU 1/2026 terbuka', /Penyesuaian Pidana/.test(h1), h1.slice(0,50))
const nButir = await page.locator('text=/^\\d+$/').count()
const semuaTeks = await page.locator('body').innerText()
cek('Frasa "55 butir" tampil', /55 butir/.test(semuaTeks))
cek('Timeline 2 Januari 2026 tampil', /2 Januari 2026/.test(semuaTeks))
cek('318 hari tampil', /\d+ hari/.test(semuaTeks), (semuaTeks.match(/berlaku \d+ hari/)||[])[0]||'')
cek('Sebut 615 & 616 dihapus', /615 & 616|615,616|615/.test(semuaTeks))
cek('Sebut 599A disisipkan', /599A/.test(semuaTeks))

// filter berfungsi
await page.locator('button', { hasText: /^Dihapus/ }).first().click(); await page.waitForTimeout(300)
const setelah = await page.locator('body').innerText()
cek('Filter "Dihapus" menyusutkan daftar', !/Ketentuan Pasal 37 diubah/.test(setelah))

// --- 2. Pasal yang DIUBAH: 37 ---
await page.goto(dasar+'#/pasal/37'); await page.waitForTimeout(600)
const t37 = await page.locator('body').innerText()
cek('Lencana "Diubah" muncul di Pasal 37', /Diubah/.test(t37))
cek('Kotak "Status terhadap UU 1/2026" tampil', /status terhadap uu 1\/2026/i.test(t37))
cek('Redaksi asli Pasal 37 masih utuh', /Dalam hal ditentukan oleh Undang-Undang/.test(t37))
cek('Redaksi masih berlabel VERBATIM', /VERBATIM/.test(t37))

// buka teks 2026
await page.locator('button', { hasText: /Lihat teks menurut UU 1\/2026/ }).first().click()
await page.waitForTimeout(300)
const t37b = await page.locator('body').innerText()
cek('Teks UU 1/2026 dapat dibuka', /Perintah perubahan/.test(t37b) && /verbatim/.test(t37b))

// --- 3. Pasal yang DIHAPUS: 615 ---
await page.goto(dasar+'#/pasal/615'); await page.waitForTimeout(600)
const t615 = await page.locator('body').innerText()
cek('Pasal 615 ditandai dihapus', /dihapus/i.test(t615) && /UU No\. 1 Tahun 2026|UU 1\/2026/.test(t615))

// --- 4. Pasal yang TIDAK berubah: 79 (jebakan) ---
await page.goto(dasar+'#/pasal/79'); await page.waitForTimeout(600)
const t79 = await page.locator('body').innerText()
cek('Pasal 79 TIDAK ditandai (benar)', !/status terhadap uu 1\/2026/i.test(t79))

// --- 5. Dashboard: status berlaku ---
await page.goto(dasar+'#/'); await page.waitForTimeout(700)
const dash = await page.locator('body').innerText()
cek('Dashboard: "Berlaku sejak 2 Januari 2026"', /Berlaku sejak 2 Januari 2026/.test(dash))
cek('Dashboard: TIDAK lagi "3 tahun setelah diundangkan"', !/3 tahun setelah diundangkan/.test(dash))
cek('Dashboard: hari berjalan disebut', /Berlaku sejak 2 Januari 2026 · \d+ hari/.test(dash),
  (dash.match(/Berlaku sejak 2 Januari 2026 · [^\n]*/)||[])[0]||'')

// --- 6. About ---
await page.goto(dasar+'#/tentang'); await page.waitForTimeout(600)
const ab = await page.locator('body').innerText()
cek('Tentang: status berlaku benar', /Berlaku sejak 2 Januari 2026/.test(ab))
cek('Tentang: dasar Pasal 624 disebut', /Pasal 624/.test(ab))

// --- 7. Tanpa overflow horizontal (ponsel) ---
for (const r of ['#/penyesuaian','#/pasal/37','#/']) {
  await page.goto(dasar+r); await page.waitForTimeout(500)
  const ov = await page.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth)
  cek(`Tanpa geser horizontal ${r}`, ov <= 1, `${ov}px`)
}

// --- 7b. Tab Peta KUHP Lama -> Baru ---
await page.goto(dasar+'#/penyesuaian'); await page.waitForTimeout(600)
await page.locator('button', { hasText: 'Peta KUHP Lama' }).first().click(); await page.waitForTimeout(400)
const peta = await page.locator('body').innerText()
cek('Tab peta terbuka', /Pasal 622/.test(peta))
cek('Sebut 29 entri & 58 pasangan', /29 entri/.test(peta) && /58 pasangan/.test(peta))
cek('Entri dicabut ditandai', /Dicabut, tanpa pengganti/.test(peta))
cek('Pemetaan tampil (Pasal 2 -> 455)', /Pasal 2[\s\S]{0,40}Pasal 455/.test(peta))

// pencarian dalam peta
const cariPeta = page.locator('input[aria-label="Cari dalam peta pemetaan"]')
await cariPeta.fill('Narkotika'); await page.waitForTimeout(400)
const petaCari = await page.locator('body').innerText()
cek('Pencarian peta menyaring', /Narkotika/.test(petaCari) && !/Penetapan Presiden Nomor 1 Tahun 1965/.test(petaCari))

// klik tautan pasal tujuan
await cariPeta.fill(''); await page.waitForTimeout(300)
await page.locator('button', { hasText: /^Pasal 455$/ }).first().click()
await page.waitForTimeout(700)
const h = await page.locator('h1').first().innerText()
cek('Klik pemetaan membuka pasal tujuan', /Pasal 455/.test(h), h)

// --- 7c. Rujukan lama di halaman pasal ---
await page.goto(dasar+'#/pasal/300'); await page.waitForTimeout(700)
const t300 = await page.locator('body').innerText()
cek('Pasal 300 menampilkan rujukan dari UU lama', /Rujukan/i.test(t300) && /Penodaan Agama|Penetapan Presiden/.test(t300))

// --- 7d. Pasal 622 teks panjang tidak jebol di ponsel ---
await page.goto(dasar+'#/pasal/622'); await page.waitForTimeout(700)
const t622 = await page.locator('body').innerText()
cek('Pasal 622 memuat uraian a..cc', /Pasal 37, Pasal 38, Pasal 39, dan Pasal 41/.test(t622))
const ov622 = await page.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth)
cek('Pasal 622 tanpa geser horizontal', ov622 <= 1, `${ov622}px`)

// --- 7e. Penjelasan pasal tampil ---
for (const [nomor, kunci] of [['433','Sifat dari perbuatan pencemaran'],['458','Pembunuhan selalu diartikan'],['466','pengertian penganiayaan'],['48','Cukup jelas']]) {
  await page.goto(dasar+'#/pasal/'+nomor); await page.waitForTimeout(500)
  const btn = page.locator('button', { hasText: /Lihat teks menurut UU 1\/2026/ }).first()
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(250) }
  const t = await page.locator('body').innerText()
  cek(`Penjelasan Pasal ${nomor} tampil verbatim`, t.includes(kunci))
}

// --- 7f. Catatan penomoran sumber tampil ---
await page.goto(dasar+'#/penyesuaian'); await page.waitForTimeout(600)
const cat = await page.locator('body').innerText()
cek('Catatan penomoran Angka 2/3 tertukar dilaporkan', /Angka 2 pada Penjelasan/.test(cat) && /tertukar/.test(cat))
cek('Pasal 132 dilaporkan tidak ditemukan', /Pasal 132/.test(cat))

// --- 7g. Kalkulator Lampiran III ---
await page.goto(dasar+'#/penyesuaian'); await page.waitForTimeout(600)
await page.locator('button', { hasText: 'Hitung Denda' }).first().click(); await page.waitForTimeout(400)
cek('Tab kalkulator terbuka', /Pidana Penjara Pengganti/i.test(await page.locator('body').innerText()))

const inp = page.locator('input#denda')
await inp.fill('1000000000'); await page.waitForTimeout(350)
const h1m = await page.locator('body').innerText()
cek('Denda Rp1 M -> 190 hari', /\b190\b/.test(h1m), (h1m.match(/(\d+) hari pidana penjara/)||[])[1] || '')
cek('Kategori VI terdeteksi', /Kategori VI/.test(h1m))

await page.locator('button', { hasText: 'Pakai contoh resmi' }).first().click(); await page.waitForTimeout(350)
const h6m = await page.locator('body').innerText()
cek('Contoh resmi Rp6 M -> 450 hari', /\b450\b/.test(h6m), (h6m.match(/(\d+) hari pidana penjara/)||[])[1] || '')
cek('Kategori VIII terdeteksi', /Kategori VIII/.test(h6m))
cek('Peringatan "bukan putusan" tampil', /bukan putusan/i.test(h6m))

// rincian
await page.locator('button', { hasText: /Lihat rincian perhitungan/ }).first().click(); await page.waitForTimeout(300)
const rinc = await page.locator('body').innerText()
cek('Rincian 4 tingkatan tampil', /di bawah kategori I/.test(rinc) && /di atas kategori VI/.test(rinc))
const ovK = await page.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth)
cek('Kalkulator tanpa geser horizontal', ovK <= 1, `${ovK}px`)

// --- 7h. Lampiran II ---
await page.goto(dasar+'#/penyesuaian'); await page.waitForTimeout(600)
await page.locator('button', { hasText: 'Lampiran II' }).first().click(); await page.waitForTimeout(400)
const l2 = await page.locator('body').innerText()
cek('Tab Lampiran II terbuka', /Narkotika/.test(l2) && /37 ketentuan/.test(l2))
cek('Pasal 111 ayat (1) tampil', /Pasal 111 ayat \(1\)/.test(l2))
cek('Kategori denda ditandai', /Denda maks\. Rp/.test(l2))
cek('Klaim penghapusan minimum khusus disebut', /paling singkat/.test(l2))

await page.locator('button', { hasText: /catatan perbaikan pindaian/ }).first().click()
await page.waitForTimeout(300)
cek('Catatan perbaikan OCR bisa dibuka', /Perbaikan galat pindaian/.test(await page.locator('body').innerText()))

const inpL2 = page.locator('input[aria-label="Cari dalam Lampiran II"]')
await inpL2.fill('143'); await page.waitForTimeout(350)
cek('Pencarian Lampiran II menyaring', /Pasal 143/.test(await page.locator('body').innerText()))
const ovL = await page.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth)
cek('Lampiran II tanpa geser horizontal', ovL <= 1, `${ovL}px`)

// --- 8. Konsol tanpa galat ---
const errs=[]
page.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
await page.goto(dasar+'#/penyesuaian'); await page.waitForTimeout(600)
cek('Tanpa galat konsol', errs.length===0, errs.slice(0,2).join(' | '))

console.log(`\n${'='.repeat(56)}\nTOTAL: ${lulus}/${lulus+gagal} lulus · ${gagal} gagal\n${'='.repeat(56)}`)
await browser.close(); srv.close()
process.exit(gagal?1:0)
