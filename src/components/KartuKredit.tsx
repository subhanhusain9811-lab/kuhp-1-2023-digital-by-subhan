/* ============================================================
   KARTU KREDIT — DIBUAT OLEH
   Menyatakan siapa pembuat dan pengalih ke bentuk digital.
   ============================================================ */
import { Kartu, Chip, Label } from '@/components/ui'
import { IkonPalu, IkonPerisai } from '@/components/Ikon'

export const KREDIT = {
  /** Nama yang ditampilkan */
  nama: 'Ahmad Subhan Suaib, S.H.',
  /** Gelar profesi — ditulis sebagai keterangan, bukan bagian nama */
  profesi: 'Advokat',
  /** Peran utama pada proyek ini */
  peran: 'Pembuat & pengalih ke bentuk digital',
} as const

/** Nama panjang: "Advokat Ahmad Subhan Suaib, S.H." */
export const KREDIT_LENGKAP = `${KREDIT.profesi} ${KREDIT.nama}`

/** Kalimat kredit tunggal — dipakai di kaki beranda, ekspor, dan sidebar */
export const KREDIT_KALIMAT = `Dibuat dan dialihkan ke bentuk digital oleh ${KREDIT_LENGKAP}`

export function KartuKredit({ ringkas = false }: { ringkas?: boolean }) {
  if (ringkas) {
    return (
      <div style={{
        marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)',
        fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7, textAlign: 'center',
      }}>
        <div>
          Dibuat dan dialihkan ke bentuk digital oleh{' '}
          <b style={{ color: 'var(--text-soft)' }}>{KREDIT_LENGKAP}</b>
        </div>
        <div style={{ marginTop: 6, opacity: .75 }}>
          Isi hukum bersumber dari Lembaran Negara. Kredit ini menyatakan karya penyusunan
          dan penghimpunan, bukan klaim atas naskah undang-undang.
        </div>
      </div>
    )
  }

  return (
    <Kartu style={{ marginTop: 14, background: 'var(--surface-2)' }}>
      <div className="row-gap" style={{ marginBottom: 10 }}>
        <IkonPalu size={15} style={{ color: 'var(--brand-700)' }} />
        <Label>Dibuat Oleh</Label>
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35 }}>
        {KREDIT.nama}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
        {KREDIT.profesi} · {KREDIT.peran}
      </div>

      <div style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        marginTop: 12, padding: '10px 12px', borderRadius: 9, background: 'var(--surface-3, #f3f4f6)',
      }}>
        <IkonPerisai size={15} style={{ color: 'var(--muted)', flex: 'none', marginTop: 2 }} />
        <div style={{ fontSize: 11.5, lineHeight: 1.7, color: 'var(--muted)' }}>
          <b style={{ color: 'var(--text-soft)' }}>Batas kredit.</b> Kredit ini menyatakan karya
          penyusunan dan penghimpunan data. Bunyi undang-undang tetap bersumber dari Lembaran
          Negara Republik Indonesia dan bukan milik perorangan. Aplikasi ini bukan penerbit
          resmi dan tidak menggantikan salinan resmi.
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip nada="brand">Penyusun aplikasi</Chip>
        <Chip nada="ok">Pengalih ke digital</Chip>
        <Chip>bukan penerbit resmi</Chip>
      </div>
    </Kartu>
  )
}
