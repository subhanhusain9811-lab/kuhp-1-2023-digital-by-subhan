/* ============================================================
   Daftar Isi — struktur resmi KUHP
   Buku → Bab → Bagian → Paragraf → Pasal
   ============================================================ */
import { useMemo, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { Kartu, Chip, Tombol } from '@/components/ui'
import { IkonCari, IkonKanan, IkonBuku, IkonTutup, IkonDaftar } from '@/components/Ikon'

export function TocPage() {
  const navigasi = useStore(s => s.navigasi)
  const [cari, setCari] = useState('')
  const [buku, setBuku] = useState<string | null>(null)

  const q = cari.trim().toLowerCase()

  const hasilCari = useMemo(() => {
    if (!q) return null
    return {
      bab: db.hierarki.filter(b =>
        b.judul.toLowerCase().includes(q) || b.kode.toLowerCase() === q,
      ),
      bagian: db.hierarki.flatMap(b =>
        b.bagian
          .filter(bg => (bg.judul ?? '').toLowerCase().includes(q))
          .map(bg => ({ bab: b, bagian: bg })),
      ),
      paragraf: db.hierarki.flatMap(b =>
        b.bagian.flatMap(bg =>
          bg.paragraf
            .filter(pg => pg.judul.toLowerCase().includes(q))
            .map(pg => ({ bab: b, bagian: bg, paragraf: pg })),
        ),
      ),
    }
  }, [q])

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 4 }}>
          Daftar Isi KUHP
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Struktur resmi: {db.meta.statistik.buku} buku, {db.meta.statistik.bab} bab,{' '}
          {db.meta.statistik.bagian} bagian, {db.meta.statistik.paragraf} paragraf, dan{' '}
          {db.meta.statistik.pasal} pasal.
        </p>
      </div>

      <div className="topbar-cari" style={{ maxWidth: 'none', marginBottom: 16 }}>
        <IkonCari size={17} className="ikon-cari" />
        <input
          className="input" value={cari} onChange={e => setCari(e.target.value)}
          placeholder="Cari bab, bagian, atau paragraf…" aria-label="Cari dalam daftar isi"
          style={{ minHeight: 42, paddingLeft: 37 }}
        />
        {cari && (
          <button onClick={() => setCari('')} aria-label="Bersihkan"
            style={{ position: 'absolute', right: 10, color: 'var(--muted)' }}>
            <IkonTutup size={15} />
          </button>
        )}
      </div>

      {/* Hasil pencarian struktur */}
      {hasilCari && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {hasilCari.bab.length === 0 && hasilCari.bagian.length === 0 && hasilCari.paragraf.length === 0 && (
            <Kartu><div style={{ fontSize: 13, color: 'var(--muted)' }}>Tidak ada bab/bagian yang cocok dengan "{cari}".</div></Kartu>
          )}
          {hasilCari.bab.map(b => (
            <Kartu key={b.kode} pad={12}>
              <button onClick={() => navigasi({ nama: 'baca', pasal: b.mulai })} style={{ textAlign: 'left', width: '100%' }}>
                <Chip nada="brand">Bab {b.kode}</Chip>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 5 }}>{b.judul}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  Pasal {b.mulai}–{b.selesai} · {b.jumlahPasal} pasal
                </div>
              </button>
            </Kartu>
          ))}
          {hasilCari.bagian.map((x, i) => (
            <Kartu key={'bg' + i} pad={12}>
              <button onClick={() => x.bagian.mulai && navigasi({ nama: 'baca', pasal: x.bagian.mulai })}
                style={{ textAlign: 'left', width: '100%' }}>
                <Chip>Bagian {x.bagian.nama}</Chip>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 5 }}>{x.bagian.judul}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  Bab {x.bab.kode} · Pasal {x.bagian.mulai}–{x.bagian.selesai}
                </div>
              </button>
            </Kartu>
          ))}
          {hasilCari.paragraf.map((x, i) => (
            <Kartu key={'pg' + i} pad={12}>
              <button onClick={() => navigasi({ nama: 'baca', pasal: x.paragraf.pasal[0] })}
                style={{ textAlign: 'left', width: '100%' }}>
                <Chip>Paragraf {x.paragraf.no}</Chip>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 5 }}>{x.paragraf.judul}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  Bab {x.bab.kode} · Bagian {x.bagian.nama} · Pasal {x.paragraf.pasal[0]}–{x.paragraf.pasal[x.paragraf.pasal.length - 1]}
                </div>
              </button>
            </Kartu>
          ))}
        </div>
      )}

      {/* Struktur lengkap */}
      {!hasilCari && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <Tombol kecil aktif={!buku} onClick={() => setBuku(null)}>Semua</Tombol>
            {db.meta.bukuDaftar.map(b => (
              <Tombol key={b.kode} kecil aktif={buku === b.kode}
                onClick={() => setBuku(buku === b.kode ? null : b.kode)}>
                {b.kode === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'}
              </Tombol>
            ))}
          </div>

          {db.meta.bukuDaftar
            .filter(b => !buku || b.kode === buku)
            .map(b => (
              <div key={b.kode} style={{ marginBottom: 24 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                  paddingBottom: 8, borderBottom: '2px solid var(--brand-200)',
                }}>
                  <IkonBuku size={17} style={{ color: 'var(--brand-700)' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {b.kode === 'BUKU KESATU' ? 'BUKU KESATU' : 'BUKU KEDUA'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                      {b.judul} · Pasal {b.mulai}–{b.selesai}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {db.hierarki.filter(x => x.buku === b.kode).map(bab => (
                    <BabPanel key={bab.kode} bab={bab} />
                  ))}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  )
}

function BabPanel({ bab }: { bab: (typeof db.hierarki)[number] }) {
  const navigasi = useStore(s => s.navigasi)
  const [buka, setBuka] = useState(false)

  return (
    <Kartu pad={0} style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setBuka(!buka)}
        aria-expanded={buka}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '11px 13px', textAlign: 'left',
          background: buka ? 'var(--surface-2)' : 'transparent',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
          background: 'var(--brand-50)', color: 'var(--brand-700)',
          padding: '3px 7px', borderRadius: 6, flex: 'none', minWidth: 34, textAlign: 'center',
        }}>{bab.kode}</span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{bab.judul}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
            Pasal {bab.mulai}–{bab.selesai} · {bab.jumlahPasal} pasal
            {bab.bagian.filter(x => x.judul).length > 0 && ` · ${bab.bagian.filter(x => x.judul).length} bagian`}
          </div>
        </div>
        <IkonKanan size={15} style={{
          color: 'var(--muted)', flex: 'none',
          transform: buka ? 'rotate(90deg)' : 'none', transition: 'transform 180ms var(--ease)',
        }} />
      </button>

      {buka && (
        <div className="anim-fade" style={{ padding: '4px 13px 13px' }}>
          {bab.bagian.map((bg, i) => (
            <div key={i} style={{ marginTop: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 0', borderBottom: '1px solid var(--border)',
              }}>
                <IkonDaftar size={12} style={{ color: 'var(--muted)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-soft)' }}>
                  {bg.nama ? `Bagian ${bg.nama}` : '—'}
                  {bg.judul ? `: ${bg.judul}` : ''}
                </span>
                {bg.mulai && (
                  <button
                    onClick={() => navigasi({ nama: 'baca', pasal: bg.mulai! })}
                    className="chip" style={{ marginLeft: 'auto', cursor: 'pointer', fontSize: 10.5, padding: '2px 7px' }}
                  >
                    {bg.mulai}–{bg.selesai}
                  </button>
                )}
              </div>

              {bg.paragraf.length > 0 && (
                <div style={{ paddingLeft: 10, marginTop: 6 }}>
                  {bg.paragraf.map(pg => (
                    <div key={pg.no} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>
                        Paragraf {pg.no}
                      </span>
                      <button
                        onClick={() => navigasi({ nama: 'baca', pasal: pg.pasal[0] })}
                        style={{ fontSize: 11.5, color: 'var(--text-soft)', fontWeight: 550, textAlign: 'left' }}
                      >
                        {pg.judul}
                      </button>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
                        {pg.pasal[0]}–{pg.pasal[pg.pasal.length - 1]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* daftar pasal ringkas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                {bg.mulai && bg.selesai && Array.from(
                  { length: Math.min(bg.selesai - bg.mulai + 1, 40) },
                  (_, k) => bg.mulai! + k,
                ).map(n => (
                  <button
                    key={n}
                    onClick={() => navigasi({ nama: 'baca', pasal: n })}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 5, minWidth: 28,
                      background: 'var(--surface-2)', color: 'var(--text-soft)',
                    }}
                    title={`Pasal ${n}`}
                  >
                    {n}
                  </button>
                ))}
                {bg.mulai && bg.selesai && bg.selesai - bg.mulai + 1 > 40 && (
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', alignSelf: 'center' }}>
                    +{bg.selesai - bg.mulai + 1 - 40}
                  </span>
                )}
              </div>
            </div>
          ))}

          {bab.bagian.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 6 }}>
              Bab ini tidak dirinci ke dalam bagian.
              <button
                onClick={() => navigasi({ nama: 'baca', pasal: bab.mulai })}
                style={{ color: 'var(--brand-700)', fontWeight: 700, marginLeft: 5 }}
              >
                Buka Pasal {bab.mulai} →
              </button>
            </div>
          )}
        </div>
      )}
    </Kartu>
  )
}
