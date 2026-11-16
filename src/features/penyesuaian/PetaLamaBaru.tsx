/* ============================================================
   PETA KUHP LAMA -> KUHP BARU (Pasal 622)
   Sumber: UU No. 1 Tahun 2026 Pasal VII angka 55. Seluruh teks
   di sini verbatim; tidak ada tambahan tafsir.
   ============================================================ */
import { useMemo, useState } from 'react'
import { Kartu, Chip, Label } from '@/components/ui'
import { petaLamaBaru } from '@/lib/lapisan2026'
import { useStore } from '@/store/useStore'

export function PetaLamaBaru() {
  const navigasi = useStore(s => s.navigasi)
  const [kueri, setKueri] = useState('')
  const [hanyaBerpasangan, setHanya] = useState(false)

  const entri = useMemo(() => {
    const q = kueri.trim().toLowerCase()
    return petaLamaBaru.entri.filter(e => {
      if (hanyaBerpasangan && e.status === 'dicabut') return false
      if (!q) return true
      const teks = `${e.huruf} ${e.isi} ${e.status === 'dicabut' ? 'dicabut' : ''} ` +
        (e.pasangan ?? []).map(p => `${p.dari} ${p.ke.join(' ')}`).join(' ')
      return teks.toLowerCase().includes(q)
    })
  }, [kueri, hanyaBerpasangan])

  return (
    <div>
      <Kartu style={{ background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 8 }}>
          <Label>{petaLamaBaru.meta.judul}</Label>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: '0 0 10px' }}>
          Ketika undang-undang lain masih merujuk pasal KUHP lama, rujukan itu kini diarahkan ke pasal
          dalam KUHP baru. Tabel ini memuat {petaLamaBaru.meta.jumlahHuruf} entri,{' '}
          {petaLamaBaru.meta.jumlahPasangan} pasangan pemetaan, dan {petaLamaBaru.meta.jumlahDicabut} undang-undang
          yang dicabut tanpa pengganti.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Cari nomor pasal atau nama undang-undang…"
            value={kueri}
            onChange={e => setKueri(e.target.value)}
            aria-label="Cari dalam peta pemetaan"
            style={{ flex: '1 1 220px', minHeight: 34, fontSize: 12.5 }}
          />
          <button
            onClick={() => setHanya(v => !v)}
            style={{
              fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 99, cursor: 'pointer',
              border: '1px solid ' + (hanyaBerpasangan ? 'var(--brand-600,#1d4ed8)' : 'var(--border)'),
              background: hanyaBerpasangan ? 'var(--brand-600,#1d4ed8)' : 'transparent',
              color: hanyaBerpasangan ? '#fff' : 'var(--muted)',
            }}
          >
            Sembunyikan yang dicabut
          </button>
        </div>
      </Kartu>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entri.map(e => {
          const dicabut = e.status === 'dicabut'
          return (
            <Kartu key={e.huruf} pad={14} style={dicabut ? { opacity: .82 } : undefined}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, minWidth: 30, height: 30, padding: '0 6px', borderRadius: 8,
                  display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800,
                  background: dicabut ? 'var(--surface-3, #eee)' : 'var(--brand-50,#eef2ff)',
                  color: dicabut ? 'var(--muted)' : 'var(--brand-700)',
                }}>{e.huruf}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {dicabut
                      ? <Chip nada="danger">Dicabut, tanpa pengganti</Chip>
                      : <Chip nada="ok">Dialihkan ke KUHP baru</Chip>}
                    {e.ayat != null && <Chip nada="brand">Pasal 622 ayat ({e.ayat})</Chip>}
                  </div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: '0 0 8px', color: 'var(--muted)' }}>
                    {e.isi}
                  </p>

                  {!dicabut && (e.pasangan?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {e.pasangan!.map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
                          fontSize: 12.5, padding: '6px 9px', borderRadius: 7, background: 'var(--surface-2)',
                        }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>Pasal {p.dari}</span>
                          <span style={{ color: 'var(--muted)' }}>→</span>
                          {p.ke.map(k => {
                            const nomor = k.match(/^(\d+)/)?.[1]
                            const sisa = k.replace(/^\d+\s*/, '')
                            return (
                              <button
                                key={k}
                                onClick={() => nomor && navigasi({ nama: 'baca', pasal: Number(nomor) })}
                                style={{
                                  background: 'none', border: 0, padding: 0, cursor: 'pointer',
                                  color: 'var(--brand-700)', fontWeight: 700, fontSize: 12.5,
                                  textDecoration: 'underline', textUnderlineOffset: 2,
                                }}
                                title={`Buka Pasal ${nomor} KUHP`}
                              >
                                Pasal {nomor}{sisa ? ' ' + sisa : ''}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Kartu>
          )
        })}
      </div>

      <Kartu style={{ marginTop: 16, background: 'var(--warn-bg,#fffbeb)', borderColor: 'var(--warn,#f59e0b)' }}>
        <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          <b>Catatan.</b> {petaLamaBaru.meta.catatan} Sumber: {petaLamaBaru.meta.sumber}.
        </p>
      </Kartu>
    </div>
  )
}
