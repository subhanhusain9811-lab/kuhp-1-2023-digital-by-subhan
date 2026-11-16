/* ============================================================
   UJI LAPISAN UU 1/2026
   Memastikan: (1) naskah asli tidak diubah, (2) nomor pasal benar,
   (3) penanda hanya di 51 pasal yang berhak, (4) 79/147/476 bersih.
   ============================================================ */
import { readFileSync } from 'node:fs'

const asli = JSON.parse(readFileSync('src/data/kuhp-data.json', 'utf8'))
const baru = JSON.parse(readFileSync('src/data/kuhp-2026.json', 'utf8'))

let lulus = 0, gagal = 0
const cek = (nama, ok, detail = '') => {
  if (ok) { lulus++; console.log(`  LULUS  ${nama}${detail ? '  → ' + detail : ''}`) }
  else { gagal++; console.log(`  GAGAL  ${nama}${detail ? '  → ' + detail : ''}`) }
}

console.log('\n=== A. NASKAH ASLI UU 1/2023 TIDAK BERUBAH ===')
cek('Jumlah pasal tetap 624', asli.pasal.length === 624, `${asli.pasal.length} pasal`)
cek('Statistik 624 pasal', asli.meta.statistik.pasal === 624)
cek('versiData tetap 1.0.0', asli.meta.versiData === '1.0.0', asli.meta.versiData)
cek('Nomor UU tetap 1/2023', asli.meta.nomor === 'UU No. 1 Tahun 2023', asli.meta.nomor)
cek('Diundangkan tetap 2 Januari 2023', asli.meta.diundangkan === '2 Januari 2023')
cek('meta.mulaiBerlaku TIDAK disunting', asli.meta.mulaiBerlaku === '3 tahun setelah diundangkan (Pasal 624)', `"${asli.meta.mulaiBerlaku}"`)
cek('Total kata redaksi tetap 44225', asli.meta.statistik.kataRedaksi === 44225, `${asli.meta.statistik.kataRedaksi}`)

// setiap pasal objek 2026 harus berada di berkas terpisah
cek('Berkas 2026 terpisah dari kuhp-data.json', !JSON.stringify(asli).includes('penyesuaian-2026'))
cek('Tidak ada field "salinan2026" di data asli', !asli.pasal.some(p => 'salinan2026' in p || 'status2026' in p))

console.log('\n=== B. STRUKTUR DATA 2026 ===')
cek('55 butir', baru.butir.length === 55, `${baru.butir.length} butir`)
cek('Nomor butir 1..55 berurutan tanpa bolong',
  baru.butir.map(b => b.butir).join(',') === Array.from({length:55},(_,i)=>i+1).join(','))
cek('49 pasal bersalinan teks', Object.keys(baru.salinanLengkap).length === 49, `${Object.keys(baru.salinanLengkap).length}`)
cek('2 pasal dihapus (615, 616)', baru.dihapus.join(',') === '615,616', baru.dihapus.join(','))
cek('1 pasal disisipkan (599A)', baru.disisipkan.length === 1 && baru.disisipkan[0].nomor === '599A')

console.log('\n=== C. SETIAP NOMOR PASAL WAJIB ADA DI KUHP ASLI ===')
const nomorAsli = new Set(asli.pasal.map(p => String(p.nomor)))
const disentuh = new Set()
for (const b of baru.butir) for (const p of b.pasal) disentuh.add(p)
// 599A adalah pasal BARU — wajar tidak ada di naskah asli
const hilang = [...disentuh].filter(n => !nomorAsli.has(n) && n !== '599A')
cek('Semua pasal tersentuh (selain 599A) ada di dataset asli', hilang.length === 0,
  hilang.length ? 'HILANG: ' + hilang.join(',') : `${disentuh.size - 1} nomor lama diperiksa`)
const baruSaja = [...disentuh].filter(n => !nomorAsli.has(n))
cek('Hanya 599A yang bukan pasal lama', JSON.stringify(baruSaja) === '["599A"]', JSON.stringify(baruSaja))
// pasal baru tidak boleh menimpa nomor lama
cek('599A tidak bertabrakan dengan pasal lama', !nomorAsli.has('599A'))

console.log('\n=== D. PASAL YANG TIDAK BOLEH DITANDAI ===')
for (const n of ['79','147','476']) {
  cek(`Pasal ${n} tidak termasuk yang diubah`, !disentuh.has(n))
}

console.log('\n=== E. TIDAK ADA GALAT OCR PADA TEKS 2026 ===')
const semuaTeks = Object.values(baru.salinanLengkap).map(p =>
  (p.teks || '') + ' ' + (p.ayat || []).map(a => a.teks).join(' ')).join(' ')
const polaOcr = [
  ['0→O dalam angka', /\d[Oo]\d/],
  ['1→l dalam angka', /\d[l]\d/],
  ['Ketenluan', /Ketenluan/],
  ['Pasa1', /Pasa1/],
  ['REPUEUK/FRESIDEN', /REPUEUK|FRESIDEN/],
  ['header SK No', /SK No \d+/],
  ['spasi hilang Jan.uari', /Jan\.uari/],
]
for (const [nama, pola] of polaOcr) cek(nama, !pola.test(semuaTeks))

console.log('\n=== F. KUTIPAN VERBATIM SPOT-CHECK ===')
const p37 = baru.salinanLengkap['37']
cek('Pasal 37 berbunyi sesuai naskah', /Dalam hal ditentukan oleh Undang-Undang/.test(p37?.teks || ''), (p37?.teks||'').slice(0,60)+'…')
const p66 = baru.salinanLengkap['66']
cek('Pasal 66 punya 6 ayat', (p66?.ayat||[]).length === 6, `${(p66?.ayat||[]).length} ayat`)
const p3 = baru.salinanLengkap['3']
cek('Pasal 3 punya 7 ayat', (p3?.ayat||[]).length === 7, `${(p3?.ayat||[]).length} ayat`)
const b53 = baru.butir.find(b => b.butir === 53)
cek('Butir 53 = "Pasal 615 dihapus."', b53?.perintah === 'Pasal 615 dihapus.', b53?.perintah)
const b47 = baru.butir.find(b => b.butir === 47)
cek('Butir 47 menyisipkan 599A antara 599 & 600',
  /Di antara Pasal 599 dan Pasal 600/.test(b47?.perintah || ''), (b47?.perintah||'').slice(0,50)+'…')
const ayatKosong = Object.entries(baru.salinanLengkap)
  .flatMap(([n, p]) => (p.ayat || []).filter(a => !a.teks || a.teks.length < 3).map(a => `${n}(${a.nomor})`))
cek('Tidak ada ayat kosong', ayatKosong.length === 0, ayatKosong.join(',') || 'bersih')

console.log(`\n${'='.repeat(56)}\nTOTAL: ${lulus}/${lulus+gagal} lulus · ${gagal} gagal\n${'='.repeat(56)}`)
process.exit(gagal ? 1 : 0)
