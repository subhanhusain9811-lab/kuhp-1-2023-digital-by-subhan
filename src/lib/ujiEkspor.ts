/* ============================================================
   Pembangun teks ekspor — dipisah dari komponen agar bisa diuji
   tanpa DOM. Logika ini identik dengan tombol Ekspor TXT.
   ============================================================ */
import { db } from './data'
import { statusPasal, LABEL_JENIS_2026 } from './lapisan2026'
import { htmlKeTeks } from './format'

/** Catatan perubahan UU 1/2026 untuk satu pasal; kosong bila tak tersentuh */
export function catatan2026(nomor: number): string[] {
  const st = statusPasal(nomor)
  if (!st.tersentuh) return []
  const label = st.jenis.map(j => LABEL_JENIS_2026[j]).join(', ')
  if (st.dihapus) return ['*** PASAL INI DIHAPUS OLEH UU NO. 1 TAHUN 2026 ***']
  if (st.baru) return ['*** PASAL BARU DARI UU NO. 1 TAHUN 2026 ***']
  if (st.hanyaPenjelasan) return ['[UU No. 1 Tahun 2026 mengubah PENJELASAN pasal ini; batang tubuh tetap]']
  return [`[DIUBAH oleh UU No. 1 Tahun 2026 (${label}) — teks di bawah adalah naskah asli 2023]`]
}

/** Ringkasan peringatan pada kepala dokumen */
export function peringatan2026(jumlahTersentuh: number, jumlahTotal: number): string[] {
  if (jumlahTersentuh === 0) return []
  return [
    `PERHATIAN: ${jumlahTersentuh} dari ${jumlahTotal} pasal dalam rentang ini`,
    'telah DIUBAH oleh UU No. 1 Tahun 2026 tentang Penyesuaian Pidana.',
    'Teks yang tercetak di bawah adalah naskah asli UU No. 1 Tahun 2023.',
    'Untuk bunyi terbaru, rujuk LN Tahun 2026 Nomor 1.',
    '',
  ]
}

/** Bangun teks ekspor untuk sekumpulan nomor pasal */
export function bangunTeks(nomorPasal: number[]): string {
  const daftar = nomorPasal
    .map(n => db.pasal.find(p => p.nomor === n))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const out: string[] = []
  out.push('='.repeat(72))
  out.push('KUHP DIGITAL — Kutipan Undang-Undang Nomor 1 Tahun 2023')
  out.push('tentang Kitab Undang-Undang Hukum Pidana')
  out.push('='.repeat(72))
  out.push('')
  out.push(`Jumlah: ${daftar.length} pasal`)
  out.push(`Diundangkan: ${db.meta.diundangkan} · ${db.meta.lembaranNegara}`)
  out.push('')

  const tersentuh = daftar.filter(p => statusPasal(p.nomor).tersentuh).length
  out.push(...peringatan2026(tersentuh, daftar.length))

  for (const p of daftar) {
    out.push(`Pasal ${p.nomor}`)
    out.push(...catatan2026(p.nomor))
    out.push('')
    const berayat = p.ayat.filter(a => a.nomor != null)
    if (berayat.length === 0) out.push(htmlKeTeks(p.teks))
    else for (const a of p.ayat) {
      if (a.nomor != null) out.push(`    (${a.nomor}) ${htmlKeTeks(a.teks)}`)
      else out.push(htmlKeTeks(a.teks))
    }
    out.push('')
  }
  return out.join('\n')
}
