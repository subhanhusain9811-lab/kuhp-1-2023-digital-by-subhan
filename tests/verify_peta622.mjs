/* Uji peta KUHP lama -> baru dari Pasal 622 */
import { readFileSync } from 'node:fs'
const d = JSON.parse(readFileSync('src/data/kuhp-2026.json', 'utf8'))
const db = JSON.parse(readFileSync('src/data/kuhp-data.json', 'utf8'))
const peta = d.petaLamaBaru

let lulus = 0, gagal = 0
const cek = (n, ok, det = '') => { ok ? lulus++ : gagal++; console.log(`  ${ok ? 'LULUS' : 'GAGAL'}  ${n}${det ? '  → ' + det : ''}`) }

console.log('\n=== PETA KUHP LAMA -> BARU (Pasal 622) ===')
cek('29 entri huruf (a..cc)', peta.entri.length === 29, `${peta.entri.length} entri`)
cek('Urutan huruf benar a..z, aa, bb, cc',
  peta.entri.map(e => e.huruf).join(',') === 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,aa,bb,cc')
cek('10 entri dicabut', peta.entri.filter(e => e.status === 'dicabut').length === 10,
  peta.entri.filter(e => e.status === 'dicabut').map(e => e.huruf).join(','))
cek('Tidak ada entri tanpa penjelasan (selain dicabut)',
  peta.entri.filter(e => e.status !== 'dicabut').every(e => e.ayat >= 2 && e.penjelas))
cek('58 pasangan pemetaan', peta.meta.jumlahPasangan === 58, `${peta.meta.jumlahPasangan}`)

// setiap nomor tujuan harus ada di KUHP
const ada = new Set(db.pasal.map(p => String(p.nomor)))
const tujuan = new Set()
for (const e of peta.entri) for (const p of e.pasangan ?? []) for (const k of p.ke) {
  const m = k.match(/^(\d+)/); if (m) tujuan.add(m[1])
}
const hilang = [...tujuan].filter(t => !ada.has(t))
cek('Semua nomor tujuan ada di KUHP 624 pasal', hilang.length === 0,
  hilang.length ? 'HILANG: ' + hilang.join(',') : `${tujuan.size} nomor unik`)

// spot-check 6 pemetaan yang juga muncul di ekstraksi independen
const cek6 = [['q', '2', ['455']], ['p', '69', ['272 ayat (2)']], ['z', '36 ayat (1)', ['374']],
              ['aa', '136', ['504']], ['bb', '4', ['602']], ['cc', '41', ['299']]]
for (const [huruf, dari, ke] of cek6) {
  const e = peta.entri.find(x => x.huruf === huruf)
  const p = (e?.pasangan ?? []).find(x => x.dari === dari)
  cek(`Huruf ${huruf}: Pasal ${dari} -> ${ke.join(', ')}`,
    !!p && JSON.stringify(p.ke) === JSON.stringify(ke), p ? p.ke.join(',') : 'tidak ditemukan')
}

// narkotika (huruf w) wajib 12 pasangan
const w = peta.entri.find(e => e.huruf === 'w')
cek('Huruf w (Narkotika) punya 12 pasangan', (w?.pasangan ?? []).length === 12, `${(w?.pasangan ?? []).length}`)

// ayat 622 tidak boleh tersisa placeholder
const ay = d.salinanLengkap['622'].ayat
cek('Pasal 622 ayat (1) terisi (bukan $50)', (ay.find(a => a.nomor === 1)?.teks ?? '').length > 5000,
  `${(ay.find(a => a.nomor === 1)?.teks ?? '').length} char`)
cek('Pasal 622 ayat (15) terisi (bukan $51)', (ay.find(a => a.nomor === 15)?.teks ?? '').length > 800,
  `${(ay.find(a => a.nomor === 15)?.teks ?? '').length} char`)
cek('Tidak ada ayat berisi placeholder di seluruh data 2026',
  !Object.values(d.salinanLengkap).some(p => (p.ayat ?? []).some(a => /^\$\w+$/.test(a.teks))))

console.log(`\n${'='.repeat(56)}\nTOTAL: ${lulus}/${lulus + gagal} lulus · ${gagal} gagal\n${'='.repeat(56)}`)
process.exit(gagal ? 1 : 0)
