/* ============================================================
   LENCANA PERUBAHAN UU 1/2026
   Penanda kecil di daftar/heading pasal. Tidak mengubah redaksi.
   ============================================================ */
import { Chip } from '@/components/ui'
import { statusPasal, LABEL_JENIS_2026 } from '@/lib/lapisan2026'

export function LencanaPerubahan({ nomor, ringkas = false }: { nomor: number | string; ringkas?: boolean }) {
  const s = statusPasal(nomor)
  if (!s.tersentuh) return null

  const nada = s.dihapus ? 'danger' : s.baru ? 'ok' : 'warn'
  const teks = ringkas
    ? (s.dihapus ? 'Dihapus 2026' : s.baru ? 'Baru 2026' : s.hanyaPenjelasan ? 'Penjelasan 2026' : 'Diubah 2026')
    : s.jenis.map(j => LABEL_JENIS_2026[j]).join(' · ')

  return (
    <Chip
      nada={nada}
      judul={`UU No. 1 Tahun 2026 tentang Penyesuaian Pidana — ${s.jenis.map(j => LABEL_JENIS_2026[j]).join(', ')}`}
    >
      {teks}
    </Chip>
  )
}
