/* ============================================================
   KOTAK PERUBAHAN UU 1/2026
   Ditampilkan di halaman pasal. Menyajikan:
   - perintah perubahan (verbatim Pasal VII)
   - teks pasal menurut UU 1/2026 (bila ada), berlabel sumber
   Naskah asli 1/2023 tetap ditampilkan di atasnya, tidak diubah.
   ============================================================ */
import { useState } from 'react'
import { Kartu, Chip, Label } from '@/components/ui'
import { statusPasal, meta2026, LABEL_JENIS_2026, rujukanLamaKe, penjelasan2026 } from '@/lib/lapisan2026'

export function Kotak2026({ nomor }: { nomor: number | string }) {
  const s = statusPasal(nomor)
  const rujukan = rujukanLamaKe(nomor)
  const penj = penjelasan2026(nomor)
  const [buka, setBuka] = useState(false)
  if (!s.tersentuh && rujukan.length === 0) return null

  if (!s.tersentuh) {
    return (
      <Kartu pad={14} style={{ marginTop: 18, background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 8 }}>
          <Label>Rujukan dari UU lain</Label>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: '0 0 8px' }}>
          Menurut Pasal 622 KUHP, rujukan berikut kini diarahkan ke pasal ini:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: 'var(--muted)' }}>
          {rujukan.map((r, i) => (
            <li key={i}>Pasal {r.dari} — {r.uuLama}</li>
          ))}
        </ul>
      </Kartu>
    )
  }

  const nada = s.dihapus ? 'danger' : s.baru ? 'ok' : 'warn'

  return (
    <Kartu
      pad={14}
      style={{
        marginTop: 18,
        borderLeft: `3px solid var(--${nada === 'danger' ? 'merah' : nada === 'ok' ? 'hijau' : 'kuning'}-500, var(--brand-500))`,
        background: 'var(--surface-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Label>Status terhadap UU 1/2026</Label>
        {s.jenis.map(j => (
          <Chip key={j} nada={nada}>{LABEL_JENIS_2026[j]}</Chip>
        ))}
      </div>

      <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: '0 0 8px' }}>
        {s.dihapus
          ? <>Pasal ini <b>dihapus</b> oleh UU No. 1 Tahun 2026 tentang Penyesuaian Pidana. Teks di atas adalah naskah asli UU No. 1 Tahun 2023 dan dipertahankan untuk keperluan penelusuran sejarah.</>
          : s.baru
          ? <>Pasal ini <b>baru disisipkan</b> oleh UU No. 1 Tahun 2026 dan tidak terdapat dalam naskah asli UU No. 1 Tahun 2023.</>
          : s.hanyaPenjelasan
          ? <>Yang diubah oleh UU No. 1 Tahun 2026 hanyalah <b>Penjelasan</b> pasal ini. Batang tubuhnya tetap seperti di atas.</>
          : <>Pasal ini <b>diubah</b> oleh UU No. 1 Tahun 2026. Teks di atas adalah naskah asli UU No. 1 Tahun 2023.</>}
      </p>

      <button
        onClick={() => setBuka(v => !v)}
        style={{
          background: 'none', border: 0, padding: 0, cursor: 'pointer',
          color: 'var(--brand-700)', fontSize: 12.5, fontWeight: 700,
        }}
      >
        {buka ? '▾ Sembunyikan teks UU 1/2026' : '▸ Lihat teks menurut UU 1/2026'}
      </button>

      {buka && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>
            <b>Perintah perubahan</b> (verbatim, {meta2026.nomor} {meta2026.dasarPasal}):
            {s.perintah.map((p, i) => (
              <div key={i} style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>{p}</div>
            ))}
          </div>

          {s.salinan && (s.salinan.teks || s.salinan.ayat?.length) ? (
            <div style={{ fontSize: 13, lineHeight: 1.75 }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>
                Teks menurut UU No. 1 Tahun 2026 (verbatim)
              </div>
              {s.salinan.teks && <p style={{ margin: '0 0 8px' }}>{s.salinan.teks}</p>}
              {s.salinan.ayat?.map(a => (
                <p key={a.nomor} style={{ margin: '0 0 8px' }}>
                  <b>({a.nomor})</b> <span style={{ whiteSpace: 'pre-line' }}>{a.teks}</span>
                </p>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              {s.dihapus
                ? 'Tidak ada teks pengganti — pasal ini dihapus.'
                : 'Perubahan tercantum pada Penjelasan undang-undang, bukan pada batang tubuh pasal.'}
            </div>
          )}

          {penj && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Penjelasan menurut UU 1/2026 (verbatim)
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{penj}</div>
            </div>
          )}
        </div>
      )}

      {rujukan.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Rujukan UU lain yang diarahkan ke pasal ini
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: 'var(--muted)' }}>
            {rujukan.map((r, i) => (
              <li key={i}>Pasal {r.dari} — {r.uuLama}</li>
            ))}
          </ul>
        </div>
      )}
    </Kartu>
  )
}
