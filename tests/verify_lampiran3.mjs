/* Uji kalkulator Lampiran III terhadap tabel resmi.
   Seluruh nilai harapan dibaca langsung dari PDF Lampiran III hlm 1-15. */
import { hitungPengganti, CONTOH_RESMI } from '/tmp/l3.mjs'

let lulus = 0, gagal = 0
const cek = (n, ok, det = '') => { ok ? lulus++ : gagal++; console.log(`  ${ok ? 'LULUS' : 'GAGAL'}  ${n}${det ? '  → ' + det : ''}`) }

console.log('\n=== LAMPIRAN III: RUMUS vs TABEL RESMI ===')
const jangkar = [
  [1_000_000, 1], [50_000_000, 50], [55_000_000, 51], [100_000_000, 60],
  [200_000_000, 80], [250_000_000, 90], [400_000_000, 120], [500_000_000, 140],
  [600_000_000, 150], [800_000_000, 170], [1_100_000_000, 200], [1_500_000_000, 240],
  [2_000_000_000, 290], [2_125_000_000, 295], [3_000_000_000, 330],
  [4_250_000_000, 380], [6_000_000_000, 450],
]
let cocok = 0
for (const [d, harap] of jangkar) {
  const h = hitungPengganti(d).hari
  const ok = h === harap
  if (ok) cocok++
  cek(`Rp${d.toLocaleString('id-ID')} = ${harap} hari`, ok, ok ? '' : `dihitung ${h}`)
}
console.log(`\n  ketepatan: ${cocok}/${jangkar.length}`)

console.log('\n=== CONTOH RESMI DARI UNDANG-UNDANG SENDIRI ===')
const c = hitungPengganti(CONTOH_RESMI.denda)
cek('Rp6.000.000.000 = 450 hari (contoh Lampiran III angka 2)', c.hari === CONTOH_RESMI.hari, `${c.hari} hari`)
cek('Rincian contoh 4 tingkatan', c.rincian.length === 4, `${c.rincian.length} tingkat`)
const r0 = c.rincian.map(r => Math.round(r.hari))
cek('Rincian 50/90/150/160 hari', r0.join(',') === '50,90,150,160', r0.join('/'))

console.log('\n=== SIFAT PERHITUNGAN ===')
cek('Denda 0 hari = 0', hitungPengganti(0).hari === 0)
cek('Naik monoton', (() => {
  let prev = -1
  for (let d = 0; d <= 6_000_000_000; d += 25_000_000) {
    const h = hitungPengganti(d).hari
    if (h < prev) return false
    prev = h
  }
  return true
})())
cek('Kategori terdeteksi: Rp1 jt = I', hitungPengganti(1_000_000).kategori === 'I')
cek('Kategori terdeteksi: Rp50 jt = III', hitungPengganti(50_000_000).kategori === 'III')
cek('Kategori terdeteksi: Rp2 M = VI', hitungPengganti(2_000_000_000).kategori === 'VI')
cek('Kategori terdeteksi: Rp6 M = VIII', hitungPengganti(6_000_000_000).kategori === 'VIII')

console.log(`\n${'='.repeat(56)}\nTOTAL: ${lulus}/${lulus + gagal} lulus · ${gagal} gagal\n${'='.repeat(56)}`)
process.exit(gagal ? 1 : 0)
