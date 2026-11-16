/* Uji Penjelasan pasal UU 1/2026 */
import { readFileSync } from 'node:fs'
const d = JSON.parse(readFileSync('src/data/kuhp-2026.json', 'utf8'))
const peta = d.petaLamaBaru
let lulus = 0, gagal = 0
const cek = (n, ok, det = '') => { ok ? lulus++ : gagal++; console.log(`  ${ok ? 'LULUS' : 'GAGAL'}  ${n}${det ? '  → ' + det : ''}`) }

console.log('\n=== PENJELASAN UU 1/2026 ===')
const p = d.penjelasan2026
cek('53 Penjelasan tersedia', Object.keys(p).length === 53, `${Object.keys(p).length}`)
cek('Meta penjelasan tercatat', !!d.meta.penjelasan?.jumlah)
cek('Pasal 48 = "Cukup jelas."', p['48'] === 'Cukup jelas.', p['48'])
cek('Pasal 433 memuat inti pencemaran', /Sifat dari perbuatan pencemaran/.test(p['433'] || ''), (p['433'] || '').slice(0, 50) + '…')
cek('Pasal 458 memuat inti pembunuhan', /Pembunuhan selalu diartikan/.test(p['458'] || ''), (p['458'] || '').slice(0, 50) + '…')
cek('Pasal 466 memuat inti penganiayaan', /pengertian penganiayaan/.test(p['466'] || ''), (p['466'] || '').slice(0, 50) + '…')
cek('Pasal 132 ada (dilewatkan sumber kedua)', /penuntutan/.test(p['132'] || ''), (p['132'] || '').slice(0, 50) + '…')
cek('Pasal 622 = "Cukup jelas." (tanpa ekor Pasal VIII/IX)', p['622'] === 'Cukup jelas.', p['622'])

// tidak ada teks kosong / terlalu pendek
const pendek = Object.entries(p).filter(([, v]) => !v || v.length < 8)
cek('Tidak ada Penjelasan kosong', pendek.length === 0, pendek.map(([k]) => k).join(',') || 'bersih')

// tidak ada boilerplate situs yang ikut masuk
const sampah = Object.entries(p).filter(([, v]) => /WhatsApp|WordPress|peraturanpajak|Dokumenterkait|info@/.test(v))
cek('Tanpa boilerplate situs web', sampah.length === 0, sampah.map(([k]) => k).join(',') || 'bersih')

// setiap Penjelasan harus punya pasal di dataset 2026 atau peta
const nomor = new Set(Object.keys(p))
// pasal sah = punya salinan, dihapus, atau disebut butir (termasuk 4 pasal 'Penjelasan saja')
const sah = new Set([...Object.keys(d.salinanLengkap), ...d.dihapus,
  ...d.butir.flatMap(b => b.pasal)])
const yatim = [...nomor].filter(n => !sah.has(n))
cek('Semua Penjelasan punya pasal yang sah', yatim.length === 0, yatim.join(',') || 'bersih')

// catatan kejujuran penomoran harus tercatat
cek('Kekeliruan penomoran sumber dilaporkan (3 butir)', (d.meta.kekeliruanPenomoran || []).length === 3,
  `${(d.meta.kekeliruanPenomoran || []).length} butir`)

// tanda kutip typographic dipertahankan
const kutip = Object.values(p).filter(v => /[“”]/.test(v)).length
cek('Tanda kutip “ ” dipertahankan', kutip > 0, `${kutip} Penjelasan`)

console.log(`\n${'='.repeat(56)}\nTOTAL: ${lulus}/${lulus + gagal} lulus · ${gagal} gagal\n${'='.repeat(56)}`)
process.exit(gagal ? 1 : 0)
