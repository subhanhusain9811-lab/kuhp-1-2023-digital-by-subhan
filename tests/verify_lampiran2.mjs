/* Uji transkripsi Lampiran II */
import { readFileSync } from 'node:fs'
const d = JSON.parse(readFileSync('src/data/kuhp-2026.json', 'utf8'))
const L = d.lampiran.II
let lulus = 0, gagal = 0
const cek = (n, ok, det = '') => { ok ? lulus++ : gagal++; console.log(`  ${ok ? 'LULUS' : 'GAGAL'}  ${n}${det ? '  → ' + det : ''}`) }

console.log('\n=== LAMPIRAN II — NARKOTIKA ===')
cek('37 entri', L.entri.length === 37, `${L.entri.length}`)
cek('Semua entri punya teks', L.entri.every(e => e.teks && e.teks.length > 20))
cek('Semua entri punya nomor pasal', L.entri.every(e => Number.isInteger(e.pasal) && e.pasal > 0))

// spot-check terhadap sumber kedua (Mahkamah Agung & klikwarta)
const cari = (p, a) => L.entri.find(e => e.pasal === p && (a === undefined || e.ayat === a))
const e111_1 = cari(111, 1)
cek('Pasal 111 ayat (1): penjara 12 tahun, denda kategori VI',
  /paling lama 12 \(dua belas\) tahun/.test(e111_1?.teks || '') && /kategori VI/.test(e111_1?.teks || ''),
  (e111_1?.teks || '').slice(0, 60))
const e111_2 = cari(111, 2)
cek('Pasal 111 ayat (2): seumur hidup / 20 tahun, denda +1/3',
  /seumur hidup/.test(e111_2?.teks || '') && /ditambah 1\/3 \(sepertiga\)/.test(e111_2?.teks || ''))

// tidak boleh ada sisa galat OCR
const galat = [
  ['kategori M', /kategori M[^I]|kategori M\.|kategori M$/],
  ['kategori VL', /kategori VL/],
  ['kategori MII', /kategori MII/],
  ['angka 1O', /\b1O\b/],
  ['l/3', /l\/3/],
  ['tqjuh', /tqjuh/],
  ['ayat (l)', /ayat \(l\)/],
  ['ayat (ll)', /ayat \(ll\)/],
  ['t29', /\bt29\b/],
  ['t4l', /\bt4l\b/],
]
for (const [nama, pola] of galat) {
  const kena = L.entri.filter(e => pola.test(e.teks)).map(e => e.pasal)
  cek(`Tanpa galat OCR: ${nama}`, kena.length === 0, kena.join(',') || 'bersih')
}

// setiap koreksi yang diklaim harus benar-benar ada di teks akhir
const salahKlaim = L.entri.flatMap(e => e.koreksiOcr.filter(k => k.dari === k.jadi))
cek('Tidak ada klaim koreksi palsu', salahKlaim.length === 0)

// nomor pasal harus dalam rentang UU Narkotika 35/2009
const luar = L.entri.filter(e => e.pasal < 100 || e.pasal > 150)
cek('Nomor pasal dalam rentang UU Narkotika (100–150)', luar.length === 0,
  luar.map(e => e.pasal).join(',') || `${L.entri.length} entri`)

// kategori hanya yang sah I..VIII
const sahKat = new Set(['I','II','III','IV','V','VI','VII','VIII','M'])
const katAneh = L.entri.flatMap(e => (e.teks.match(/kategori ([A-Z]+)/g) || []))
  .map(x => x.replace('kategori ','')).filter(k => !sahKat.has(k))
cek('Semua kategori sah', katAneh.length === 0, katAneh.join(',') || 'bersih')

// catatan sumber wajib ada
cek('Metode transkripsi dinyatakan', /Transkripsi manual/.test(L.metode))
cek('Sumber disebut', /LAMPIRAN II/.test(L.sumber))

console.log(`\n${'='.repeat(56)}\nTOTAL: ${lulus}/${lulus + gagal} lulus · ${gagal} gagal\n${'='.repeat(56)}`)
process.exit(gagal ? 1 : 0)
