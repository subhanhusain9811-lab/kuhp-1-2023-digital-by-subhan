/* ============================================================
   LAMPIRAN II — PERUBAHAN KETENTUAN PIDANA NARKOTIKA
   Transkripsi dari PDF salinan resmi. Setiap koreksi galat OCR
   ditampilkan terbuka, tidak disembunyikan.
   ============================================================ */
import { useMemo, useState } from 'react'
import { Kartu, Chip, Label } from '@/components/ui'
import { lampiranII } from '@/lib/lapisan2026'
import { KATEGORI_DENDA } from '@/lib/lampiran3'

export function LampiranII() {
  const [kueri, setKueri] = useState('')
  const [tampilKoreksi, setTampil] = useState(false)

  const entri = useMemo(() => {
    const q = kueri.trim().toLowerCase()
    if (!q) return lampiranII.entri
    return lampiranII.entri.filter(e =>
      `${e.pasal} ${e.ayat ?? ''} ${e.teks}`.toLowerCase().includes(q))
  }, [kueri])

  const jumlahKoreksi = lampiranII.entri.reduce((n, e) => n + e.koreksiOcr.length, 0)

  return (
    <div>
      <Kartu style={{ background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 8 }}>
          <Label>Lampiran II — {lampiranII.judul}</Label>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: '0 0 10px' }}>
          {lampiranII.jumlah} ketentuan pidana dalam UU Narkotika yang ancamannya disesuaikan.
          Dasar: {lampiranII.dasar}. Yang paling menonjol: frasa <b>“pidana penjara paling singkat”</b>{' '}
          dihapus, sehingga tidak ada lagi batas minimum khusus.
        </p>
        <input
          className="input"
          placeholder="Cari pasal Narkotika atau kategori…"
          value={kueri}
          onChange={e => setKueri(e.target.value)}
          aria-label="Cari dalam Lampiran II"
          style={{ width: '100%', minHeight: 34, fontSize: 12.5 }}
        />
      </Kartu>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entri.map((e, i) => {
          const kat = e.teks.match(/kategori (VIII|VII|VI|V|IV|III|II|I)\b/)
          const k = kat ? KATEGORI_DENDA.find(x => x.kategori === kat[1]) : null
          return (
            <Kartu key={`${e.pasal}-${e.ayat}-${i}`} pad={13}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                <Chip nada="brand">
                  Pasal {e.pasal}{e.ayat != null ? ` ayat (${e.ayat})` : ''}
                </Chip>
                {k && <Chip nada="warn" judul={`Batas denda ${k.label}`}>Denda maks. {k.label}</Chip>}
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.75, margin: 0 }}>{e.teks}</p>

              {e.koreksiOcr.length > 0 && tampilKoreksi && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
                  <b>Perbaikan galat pindaian:</b>{' '}
                  {e.koreksiOcr.map(x => `“${x.dari}” → “${x.jadi}”`).join(' · ')}
                </div>
              )}
            </Kartu>
          )
        })}
      </div>

      <Kartu style={{ marginTop: 14 }}>
        <button
          onClick={() => setTampil(v => !v)}
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--brand-700)', fontSize: 12.5, fontWeight: 700 }}
        >
          {tampilKoreksi ? '▾ Sembunyikan catatan perbaikan' : `▸ Tampilkan ${jumlahKoreksi} catatan perbaikan pindaian`}
        </button>
      </Kartu>

      <Kartu style={{ marginTop: 16, background: 'var(--warn-bg,#fffbeb)', borderColor: 'var(--warn,#f59e0b)' }}>
        <p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 8px' }}>
          <b>Soal sumber.</b> {lampiranII.catatan} {lampiranII.metode}
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          Rujuk {lampiranII.sumber} untuk keperluan resmi.
        </p>
      </Kartu>
    </div>
  )
}
