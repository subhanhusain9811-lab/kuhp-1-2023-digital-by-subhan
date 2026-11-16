/* ============================================================
   KALKULATOR PIDANA PENJARA PENGGANTI PIDANA DENDA
   Menerapkan rumus Lampiran III UU No. 1 Tahun 2026.
   Hasil hitung adalah ALAT BANTU, bukan putusan.
   ============================================================ */
import { useMemo, useState } from 'react'
import { Kartu, Chip, Label } from '@/components/ui'
import { hitungPengganti, rupiah, KATEGORI_DENDA, CONTOH_RESMI } from '@/lib/lampiran3'

export function KalkulatorDenda() {
  const [nilai, setNilai] = useState('')
  const [buka, setBuka] = useState(false)

  const denda = useMemo(() => {
    const bersih = nilai.replace(/[^\d]/g, '')
    return bersih ? Number(bersih) : 0
  }, [nilai])

  const hasil = useMemo(() => hitungPengganti(denda), [denda])

  return (
    <div>
      <Kartu style={{ background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Metode Penghitungan Pidana Penjara Pengganti Pidana Denda</Label>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: '0 0 12px' }}>
          Lampiran III UU No. 1 Tahun 2026 menetapkan cara mengubah pidana denda yang tidak dibayar
          menjadi pidana penjara. Penghitungannya <b>progresif</b>: makin besar dendanya, makin besar
          nilai rupiah per hari, sehingga total harinya bertambah makin cepat.
        </p>

        <label htmlFor="denda" style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
          Jumlah pidana denda
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted)' }}>Rp</span>
            <input
              id="denda"
              className="input"
              inputMode="numeric"
              placeholder="6.000.000.000"
              value={nilai ? denda.toLocaleString('id-ID') : ''}
              onChange={e => setNilai(e.target.value)}
              aria-describedby="hasil-denda"
              style={{ minHeight: 40, fontSize: 14, paddingLeft: 34, width: '100%' }}
            />
          </div>
          <button
            onClick={() => setNilai(String(CONTOH_RESMI.denda))}
            style={{
              fontSize: 12, fontWeight: 700, padding: '9px 13px', borderRadius: 99, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)',
            }}
          >
            Pakai contoh resmi
          </button>
        </div>

        <div id="hasil-denda" aria-live="polite" style={{ marginTop: 14 }}>
          {denda > 0 ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
                padding: '12px 14px', borderRadius: 10, background: 'var(--brand-50, #eef2ff)',
              }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-700)' }}>{hasil.hari}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-700)' }}>hari pidana penjara pengganti</span>
                {hasil.kategori && <Chip nada="brand">Kategori {hasil.kategori}</Chip>}
              </div>

              <button
                onClick={() => setBuka(v => !v)}
                style={{ background: 'none', border: 0, padding: '8px 0 0', cursor: 'pointer', color: 'var(--brand-700)', fontSize: 12, fontWeight: 700 }}
              >
                {buka ? '▾ Sembunyikan rincian' : '▸ Lihat rincian perhitungan'}
              </button>

              {buka && (
                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.8 }}>
                  {hasil.rincian.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
                      padding: '5px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ flex: '1 1 190px', color: 'var(--muted)' }}>{r.teks}</span>
                      <span>{rupiah(r.nominal)} ÷ {rupiah(r.perHari)}/hari</span>
                      <b style={{ minWidth: 60, textAlign: 'right' }}>{Math.round(r.hari)} hari</b>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 800 }}>
                    <span>Total</span><span>{hasil.hari} hari</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>
              Masukkan jumlah denda untuk melihat hasilnya.
            </p>
          )}
        </div>
      </Kartu>

      {/* Tabel acuan kategori */}
      <Kartu style={{ marginTop: 14 }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Acuan Kategori Denda — Pasal 79 KUHP</Label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '6px 14px', fontSize: 12.5 }}>
          {KATEGORI_DENDA.map(k => (
            <div key={k.kategori} style={{
              display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0',
              borderBottom: '1px solid var(--border)',
              fontWeight: denda > 0 && hasil.kategori === k.kategori ? 800 : 400,
            }}>
              <span>Kategori {k.kategori}</span><span style={{ color: 'var(--muted)' }}>{k.label}</span>
            </div>
          ))}
        </div>
      </Kartu>

      <Kartu style={{ marginTop: 16, background: 'var(--warn-bg,#fffbeb)', borderColor: 'var(--warn,#f59e0b)' }}>
        <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          <b>Ini alat bantu, bukan putusan.</b> Rumus ini mereproduksi tabel resmi Lampiran III
          (diuji pada 17 titik, seluruhnya cocok, termasuk contoh Rp6.000.000.000 = 450 hari yang
          diberikan undang-undang sendiri). Tetapi penjatuhan pidana tetap kewenangan hakim dan
          tunduk pada ketentuan lain yang berlaku.
        </p>
      </Kartu>
    </div>
  )
}
