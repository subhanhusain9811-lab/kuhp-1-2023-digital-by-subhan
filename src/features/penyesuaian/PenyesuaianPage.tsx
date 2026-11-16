/* ============================================================
   HALAMAN PENYESUAIAN PIDANA — UU No. 1 Tahun 2026
   Menampilkan seluruh 55 butir Pasal VII apa adanya, timeline
   keberlakuan, dan penanda pasal yang tersentuh.
   ============================================================ */
import { useMemo, useState } from 'react'
import { Kartu, Chip, Kosong, Label } from '@/components/ui'
import {
  meta2026, semuaButir2026, pasalBersalinan2026, pasalDihapus2026,
  pasalBaru2026, LABEL_JENIS_2026,
} from '@/lib/lapisan2026'
import { hariSejakBerlaku, DASAR_BERLAKU } from '@/lib/statusBerlaku'
import type { JenisPerubahan } from '@/lib/types'
import { PetaLamaBaru } from './PetaLamaBaru'
import { KalkulatorDenda } from './KalkulatorDenda'
import { LampiranII } from './LampiranII'

function jenisDari(perintah: string): JenisPerubahan {
  const p = perintah.toLowerCase()
  if (p.startsWith('pasal') && p.includes('dihapus')) return 'dihapus'
  if (p.includes('disisipkan')) return 'disisipkan'
  if (p.includes('penjelasan pasal')) return 'penjelasan'
  if (p.includes('ditambahkan')) return 'ditambah_ayat'
  return 'diubah'
}

const SEMUA_JENIS: JenisPerubahan[] = ['diubah', 'ditambah_ayat', 'disisipkan', 'dihapus', 'penjelasan']

export function PenyesuaianPage() {
  const [tab, setTab] = useState<'butir' | 'peta' | 'denda' | 'lampiran'>('butir')
  const [saring, setSaring] = useState<JenisPerubahan | null>(null)
  const [buka, setBuka] = useState<number | null>(null)

  const daftar = useMemo(
    () => semuaButir2026
      .map(b => ({ ...b, jenis: jenisDari(b.perintah) }))
      .filter(b => !saring || b.jenis === saring),
    [saring],
  )

  const hitung = useMemo(() => {
    const h = {} as Record<JenisPerubahan, number>
    for (const j of SEMUA_JENIS) h[j] = 0
    for (const b of semuaButir2026) h[jenisDari(b.perintah)]++
    return h
  }, [])

  const hari = hariSejakBerlaku()

  return (
    <div className="anim-fade">
      <header style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', color: 'var(--brand-700)', textTransform: 'uppercase', marginBottom: 6 }}>
          Lapisan tambahan · bukan bagian naskah asli
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, margin: '0 0 8px' }}>
          {meta2026.judul}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
          Undang-undang ini <b>mengubah</b> UU No. 1 Tahun 2023 tentang KUHP melalui {meta2026.dasarPasal},
          sebanyak {meta2026.jumlahButir} butir perubahan. Naskah asli KUHP di aplikasi ini
          <b> tidak diubah satu karakter pun</b> — perubahan disajikan sebagai lapisan keterangan.
        </p>
      </header>

      {/* ===== Tab ===== */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {([['butir', '55 Butir Perubahan'], ['peta', 'Peta KUHP Lama → Baru'], ['denda', 'Hitung Denda → Penjara'], ['lampiran', 'Lampiran II · Narkotika']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              fontSize: 12.5, fontWeight: 800, padding: '8px 14px', borderRadius: 99, cursor: 'pointer',
              border: '1px solid ' + (tab === id ? 'var(--brand-600,#1d4ed8)' : 'var(--border)'),
              background: tab === id ? 'var(--brand-600,#1d4ed8)' : 'transparent',
              color: tab === id ? '#fff' : 'var(--muted)',
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'lampiran' ? <LampiranII /> : tab === 'denda' ? <KalkulatorDenda /> : tab === 'peta' ? <PetaLamaBaru /> : (<>

      {/* ===== Identitas & status ===== */}
      <Kartu style={{ background: 'var(--surface-2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '10px 20px', fontSize: 12.5, lineHeight: 1.6 }}>
          <div><b>Nomor:</b> {meta2026.nomor}</div>
          <div><b>Diundangkan:</b> {meta2026.diundangkan}</div>
          <div><b>Mulai berlaku:</b> {meta2026.mulaiBerlaku}</div>
          <div><b>Lembaran Negara:</b> {meta2026.lembaranNegara}</div>
          <div><b>Mengubah:</b> {meta2026.mengubah}</div>
          <div><b>Pasal lama yang disentuh:</b> {meta2026.jumlahPasalDisentuh} pasal</div>
          <div><b>Pasal baru:</b> {meta2026.jumlahPasalBaru} pasal (599A)</div>
        </div>
      </Kartu>

      {/* ===== Timeline ===== */}
      <Kartu style={{ marginTop: 14 }}>
        <div className="row-gap" style={{ marginBottom: 14 }}>
          <Label>Timeline Keberlakuan</Label>
        </div>
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'var(--border)' }} />
          {[
            { t: '2 Januari 2023', j: 'KUHP (UU 1/2023) diundangkan', d: 'LN RI Tahun 2023 Nomor 1. Belum berlaku saat itu.', aktif: true },
            { t: '2 Januari 2026', j: 'KUHP mulai berlaku', d: 'Genap 3 tahun sejak diundangkan — Pasal 624. ' + (hari > 0 ? `Kini telah berlaku ${hari} hari.` : ''), aktif: hari > 0 },
            { t: '2 Januari 2026', j: 'UU 1/2026 berlaku bersamaan', d: 'Penyesuaian Pidana langsung berlaku pada hari yang sama (Pasal IX).', aktif: true },
          ].map((x, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{
                position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: 99,
                background: x.aktif ? 'var(--brand-600, #1d4ed8)' : 'var(--border)',
                border: '2px solid var(--surface)',
              }} />
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-700)' }}>{x.t}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{x.j}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{x.d}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6, margin: '6px 0 0' }}>
          {DASAR_BERLAKU}
        </p>
      </Kartu>

      {/* ===== Ringkasan jenis perubahan ===== */}
      <Kartu style={{ marginTop: 14 }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Ringkasan {meta2026.jumlahButir} Butir Perubahan</Label>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button onClick={() => setSaring(null)} style={gayaTombol(saring === null)}>
            Semua ({semuaButir2026.length})
          </button>
          {SEMUA_JENIS.map(j => (
            <button key={j} onClick={() => setSaring(saring === j ? null : j)} style={gayaTombol(saring === j)}>
              {LABEL_JENIS_2026[j]} ({hitung[j]})
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65 }}>
          Pasal dihapus seluruhnya: <b>{pasalDihapus2026.join(' & ')}</b> · Pasal baru disisipkan:{' '}
          <b>{pasalBaru2026.map(s => `${s.nomor} (di antara Pasal ${s.diAntara[0]} dan ${s.diAntara[1]})`).join(', ')}</b>
        </div>
      </Kartu>

      {/* ===== Daftar butir ===== */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {daftar.length === 0 && <Kosong judul="Tidak ada butir" pesan="Tidak ada butir pada kategori ini." />}
        {daftar.map(b => {
          const terbuka = buka === b.butir
          const salinan = b.pasal[0] ? pasalBersalinan2026[b.pasal[0]] : undefined
          return (
            <Kartu key={b.butir} pad={14}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center',
                  background: 'var(--brand-50, #eef2ff)', color: 'var(--brand-700)',
                  fontSize: 12, fontWeight: 800,
                }}>{b.butir}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <Chip nada={b.jenis === 'dihapus' ? 'danger' : b.jenis === 'disisipkan' ? 'ok' : 'warn'}>
                      {LABEL_JENIS_2026[b.jenis]}
                    </Chip>
                    {b.pasal.map(n => (
                      <Chip key={n} nada="brand">Pasal {n}</Chip>
                    ))}
                    {b.pasal.length === 0 && b.jenis === 'dihapus' && (
                      <Chip nada="danger">dihapus</Chip>
                    )}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{b.perintah}</p>

                  {(salinan || b.pasal.length > 0) && (
                    <button
                      onClick={() => setBuka(terbuka ? null : b.butir)}
                      style={{ background: 'none', border: 0, padding: '6px 0 0', cursor: 'pointer', color: 'var(--brand-700)', fontSize: 12, fontWeight: 700 }}
                    >
                      {terbuka ? '▾ Sembunyikan teks' : '▸ Lihat teks menurut UU 1/2026'}
                    </button>
                  )}

                  {terbuka && salinan && (
                    <div style={{ marginTop: 8, padding: 10, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12.5, lineHeight: 1.75 }}>
                      {salinan.teks && <p style={{ margin: '0 0 8px' }}>{salinan.teks}</p>}
                      {salinan.ayat?.map(a => (
                        <p key={a.nomor} style={{ margin: '0 0 8px' }}>
                          <b>({a.nomor})</b> <span style={{ whiteSpace: 'pre-line' }}>{a.teks}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Kartu>
          )
        })}
      </div>

      </>)}

      {/* ===== Catatan sumber ===== */}
      <Kartu style={{ marginTop: 18, background: 'var(--warn-bg, #fffbeb)', borderColor: 'var(--warn, #f59e0b)' }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
          Catatan Sumber
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 10px' }}>
          {meta2026.sumber.catatan} Teks diambil dari {meta2026.sumber.utama}, dengan pembanding{' '}
          {meta2026.sumber.pembanding}. Untuk keperluan resmi, selalu rujuk salinan resmi pada Lembaran
          Negara {meta2026.lembaranNegara}.
        </p>
        {meta2026.penjelasan && (
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 10px' }}>
            <b>Penjelasan pasal:</b> {meta2026.penjelasan.jumlah} Penjelasan pasal disertakan verbatim
            (tampil saat Anda membuka teks UU 1/2026 pada halaman pasal).{' '}
            {meta2026.penjelasan.verifikasi}.
          </p>
        )}
        {!!meta2026.kekeliruanPenomoran?.length && (
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            <b>Catatan penomoran pada naskah sumber (tidak kami perbaiki, hanya dilaporkan):</b>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {meta2026.kekeliruanPenomoran.map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          </div>
        )}
      </Kartu>
    </div>
  )
}

function gayaTombol(aktif: boolean): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 99, cursor: 'pointer',
    border: '1px solid ' + (aktif ? 'var(--brand-600, #1d4ed8)' : 'var(--border)'),
    background: aktif ? 'var(--brand-600, #1d4ed8)' : 'transparent',
    color: aktif ? '#fff' : 'var(--muted)',
  }
}
