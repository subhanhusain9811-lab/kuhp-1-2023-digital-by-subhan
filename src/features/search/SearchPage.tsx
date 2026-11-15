/* ============================================================
   Halaman Pencarian Hibrida
   Menampilkan jenis kecocokan, kutipan verbatim, kata yang cocok,
   alasan relevansi, serta pemisahan tegas antara hasil redaksi dan
   hasil semantik (bukan teks resmi).
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { cari, uraiKueri, saranKueri, SARAN_POPULER } from '@/search/query'
import { KONSEP } from '@/search/concepts'
import { ringkasAncaman, sorotKata, adaAncaman } from '@/lib/format'
import { Kartu, Chip, Tombol, Kosong, Label } from '@/components/ui'
import {
  IkonCari, IkonKanan, IkonSimpan, IkonSimpanIsi, IkonInfo, IkonFuzzy,
  IkonTarget, IkonPalu, IkonPetir, IkonFilterX, IkonTutup,
} from '@/components/Ikon'
import type { HasilCari, JenisCocok } from '@/lib/types'

const LABEL_JENIS: Record<JenisCocok, { label: string; nada: 'brand' | 'ok' | 'warn' | 'netral'; ikon: React.ReactNode }> = {
  nomor: { label: 'Nomor Pasal', nada: 'brand', ikon: <IkonTarget size={10} /> },
  redaksional: { label: 'Kata Kunci', nada: 'ok', ikon: <IkonCari size={10} /> },
  fuzzy: { label: 'Mirip (Fuzzy)', nada: 'warn', ikon: <IkonFuzzy size={10} /> },
  semantik: { label: 'Makna (Semantik)', nada: 'netral', ikon: <IkonPetir size={10} /> },
}

export function SearchPage({ qAwal }: { qAwal?: string }) {
  const navigasi = useStore(s => s.navigasi)
  const catatCari = useStore(s => s.catatCari)
  const riwayatCari = useStore(s => s.riwayatCari)
  const bookmark = useStore(s => s.bookmark)
  const toggleBookmark = useStore(s => s.toggleBookmark)
  const tampilkanToast = useStore(s => s.tampilkanToast)

  const [q, setQ] = useState(qAwal ?? '')
  const [qAktif, setQAktif] = useState(qAwal ?? '')
  const [filterJenis, setFilterJenis] = useState<JenisCocok | null>(null)
  const [filterBuku, setFilterBuku] = useState<string>('')
  const [filterBab, setFilterBab] = useState<string>('')
  const refInput = useRef<HTMLInputElement>(null)

  // Kueri baru dari luar (deep link / kotak cari global) harus memulai
  // dengan saringan bersih, agar hasil tidak "kosong" karena filter lama.
  useEffect(() => {
    setQ(qAwal ?? '')
    setQAktif(qAwal ?? '')
    setFilterJenis(null)
    setFilterBuku('')
    setFilterBab('')
  }, [qAwal])
  useEffect(() => { refInput.current?.focus() }, [])

  const hasil = useMemo(() => {
    if (!qAktif.trim()) return []
    return cari(qAktif, { batas: 120, hanyaBuku: filterBuku || undefined, hanyaBab: filterBab || undefined })
  }, [qAktif, filterBuku, filterBab])

  const urai = useMemo(() => qAktif.trim() ? uraiKueri(qAktif) : null, [qAktif])
  const saran = useMemo(() => hasil.length === 0 && qAktif.trim() ? saranKueri(qAktif) : [], [hasil, qAktif])

  const tampil = filterJenis ? hasil.filter(h => h.jenis.includes(filterJenis)) : hasil

  const kirim = (teks: string) => {
    const t = teks.trim()
    if (!t) return
    setQ(t); setQAktif(t); catatCari(t)
    navigasi({ nama: 'cari', q: t })
  }

  const hitungJenis = (j: JenisCocok) => hasil.filter(h => h.jenis.includes(j)).length
  const adaSemantikSaja = tampil.some(h => h.jenis.length === 1 && h.jenis[0] === 'semantik')

  const babTersedia = db.hierarki.filter(b => !filterBuku || b.buku === filterBuku)

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 4 }}>
          Pencarian Hibrida
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Empat mesin pencari bekerja bersamaan: nomor pasal, kata kunci redaksi, toleransi salah ketik,
          dan pemetaan makna ke konsep hukum.
        </p>
      </div>

      {/* Kotak pencarian */}
      <form
        onSubmit={e => { e.preventDefault(); kirim(q) }}
        style={{ display: 'flex', gap: 8, marginBottom: 14 }}
      >
        <div className="topbar-cari" style={{ flex: 1, maxWidth: 'none' }}>
          <IkonCari size={17} className="ikon-cari" />
          <input
            ref={refInput}
            className="input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Kata kunci, nomor pasal, atau uraian perbuatan…"
            aria-label="Kata kunci pencarian"
            style={{ minHeight: 42, paddingLeft: 37 }}
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(''); setQAktif('') }}
              aria-label="Bersihkan"
              style={{ position: 'absolute', right: 10, color: 'var(--muted)' }}
            >
              <IkonTutup size={15} />
            </button>
          )}
        </div>
        <Tombol nada="primary" type="submit">Cari</Tombol>
      </form>

      {/* Saran populer (saat kosong) */}
      {!qAktif.trim() && (
        <>
          <div className="sek" style={{ marginTop: 18 }}><h2>Konsep Hukum Populer</h2></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {SARAN_POPULER.map(s => (
              <button key={s} className="chip" style={{ cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650 }}
                onClick={() => kirim(s)}>
                <IkonCari size={11} /> {s}
              </button>
            ))}
          </div>

          <div className="sek"><h2>Jelajahi berdasarkan Konsep</h2></div>
          <div className="grid-2">
            {KONSEP.map(k => (
              <button key={k.id} className="card" style={{ textAlign: 'left', padding: 13 }}
                onClick={() => kirim(k.nama)}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>{k.nama}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 7 }}>
                  {k.keterangan}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {k.pasal.slice(0, 5).map(n => (
                    <span key={n} className="mono" style={{
                      fontSize: 10, fontWeight: 700, background: 'var(--brand-50)',
                      color: 'var(--brand-700)', padding: '1px 6px', borderRadius: 5,
                    }}>{n}</span>
                  ))}
                  {k.pasal.length > 5 && (
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 650, alignSelf: 'center' }}>
                      +{k.pasal.length - 5}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {riwayatCari.length > 0 && (
            <>
              <div className="sek"><h2>Riwayat Pencarian</h2></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {riwayatCari.map(x => (
                  <button key={x} className="chip" style={{ cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}
                    onClick={() => kirim(x)}>
                    <IkonCari size={11} /> {x}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ===== Hasil ===== */}
      {qAktif.trim() && (
        <>
          {/* Ringkasan pemahaman kueri */}
          {urai && (
            <Kartu pad={12} style={{ marginBottom: 12, background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <Label>Kueri dipahami sebagai</Label>
                {urai.nomorPasal != null && (
                  <Chip nada="brand" ikon={<IkonTarget size={10} />}>
                    Pasal {urai.nomorPasal}{urai.nomorAyat ? ` ayat (${urai.nomorAyat})` : ''}
                  </Chip>
                )}
                {urai.konsep.map(k => (
                  <Chip key={k.id} nada="netral" ikon={<IkonPetir size={10} />} judul={k.keterangan}>
                    {k.nama}
                  </Chip>
                ))}
                {urai.tokens.slice(0, 6).map(t => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </Kartu>
          )}

          {/* Baris kontrol */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {tampil.length} hasil
              {filterJenis && <span style={{ color: 'var(--muted)', fontWeight: 600 }}> · filter aktif</span>}
            </div>
            <span className="spacer" />
            {(['nomor', 'redaksional', 'fuzzy', 'semantik'] as JenisCocok[]).map(j => {
              const n = hitungJenis(j)
              if (n === 0) return null
              return (
                <button
                  key={j}
                  onClick={() => setFilterJenis(filterJenis === j ? null : j)}
                  className="chip"
                  style={{
                    cursor: 'pointer', fontSize: 11.5, padding: '5px 10px',
                    background: filterJenis === j ? 'var(--brand-500)' : undefined,
                    color: filterJenis === j ? '#fff' : undefined,
                    border: filterJenis === j ? '1px solid var(--brand-500)' : '1px solid transparent',
                    fontWeight: 700,
                  }}
                >
                  {LABEL_JENIS[j].label} · {n}
                </button>
              )
            })}
            {(filterJenis || filterBuku || filterBab) && (
              <button className="chip" style={{ cursor: 'pointer', fontSize: 11.5, padding: '5px 10px' }}
                onClick={() => { setFilterJenis(null); setFilterBuku(''); setFilterBab('') }}>
                <IkonFilterX size={11} /> Reset
              </button>
            )}
          </div>

          {/* Saringan buku/bab */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <select className="input" value={filterBuku} style={{ maxWidth: 200, minHeight: 34, fontSize: 12.5 }}
              onChange={e => { setFilterBuku(e.target.value); setFilterBab('') }}
              aria-label="Saring berdasarkan buku">
              <option value="">Semua buku</option>
              <option value="BUKU KESATU">Buku Kesatu (1–187)</option>
              <option value="BUKU KEDUA">Buku Kedua (188–624)</option>
            </select>
            <select className="input" value={filterBab} style={{ maxWidth: 300, minHeight: 34, fontSize: 12.5 }}
              onChange={e => setFilterBab(e.target.value)}
              aria-label="Saring berdasarkan bab">
              <option value="">Semua bab</option>
              {babTersedia.map(b => (
                <option key={b.buku + b.kode} value={b.kode}>Bab {b.kode} — {b.judul.slice(0, 42)}</option>
              ))}
            </select>
          </div>

          {adaSemantikSaja && (
            <div style={{
              display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10,
              background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 12,
              fontWeight: 600, marginBottom: 12, lineHeight: 1.55,
            }}>
              <IkonInfo size={15} style={{ flex: 'none', marginTop: 1 }} />
              <span>
                Sebagian hasil di bawah berasal dari pemetaan makna, bukan pencocokan kata.
                Hasil semantik adalah <b>saran</b> dan bukan kutipan teks resmi.
              </span>
            </div>
          )}

          {tampil.length === 0 ? (
            <Kartu>
              <Kosong
                ikon={<IkonCari size={24} />}
                judul={`Tidak ada hasil untuk "${qAktif}"`}
                pesan="Coba kata kunci lain, nomor pasal, atau pilih konsep hukum di atas."
                aksi={saran.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>Mungkin maksud Anda:</span>
                    {saran.map(s => (
                      <button key={s} className="chip" style={{ cursor: 'pointer' }} onClick={() => kirim(s)}>{s}</button>
                    ))}
                  </div>
                ) : undefined}
              />
            </Kartu>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {tampil.map(h => (
                <HasilKartu
                  key={h.pasal.nomor}
                  h={h}
                  tersimpan={bookmark.some(b => b.pasal === h.pasal.nomor)}
                  onSimpan={() => {
                    const a = toggleBookmark(h.pasal.nomor)
                    tampilkanToast(a ? 'Ditambahkan ke bookmark' : 'Bookmark dihapus')
                  }}
                  onBuka={() => navigasi({ nama: 'baca', pasal: h.pasal.nomor, ayat: h.ayatNomor })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function HasilKartu({
  h, tersimpan, onSimpan, onBuka,
}: { h: HasilCari; tersimpan: boolean; onSimpan: () => void; onBuka: () => void }) {
  const p = h.pasal
  const html = useMemo(() => sorotKata(h.kutipan, h.sorotan), [h.kutipan, h.sorotan])

  return (
    <Kartu pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{
          width: 3, flex: 'none',
          background: h.jenis.includes('nomor') ? 'var(--brand-500)'
            : h.jenis.includes('redaksional') ? 'var(--ok)'
              : h.jenis.includes('fuzzy') ? 'var(--warn)' : 'var(--border-strong)',
        }} />
        <div style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
          {/* kepala */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
            <button onClick={onBuka} style={{
              fontSize: 15, fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '-.01em',
            }}>
              Pasal {p.nomor}
            </button>
            {h.ayatNomor != null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                ayat ({h.ayatNomor})
              </span>
            )}
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 650 }}>
              Bab {p.bab} · {p.buku === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'}
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {h.jenis.map(j => (
                <Chip key={j} nada={LABEL_JENIS[j].nada} ikon={LABEL_JENIS[j].ikon}>
                  {LABEL_JENIS[j].label}
                </Chip>
              ))}
            </span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 5 }}>
            {p.babJudul}
          </div>

          {/* kutipan verbatim */}
          <p
            style={{
              fontFamily: 'var(--font-doc)', fontSize: 13.5, lineHeight: 1.62,
              color: 'var(--text-soft)', margin: 0,
              borderLeft: '2px solid var(--border)', paddingLeft: 10,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* alasan relevansi */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8,
            fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55,
          }}>
            <IkonInfo size={12} style={{ flex: 'none', marginTop: 2 }} />
            <span><b style={{ color: 'var(--text-soft)' }}>Alasan relevansi:</b> {h.alasan}</span>
          </div>

          {/* kata cocok + ancaman + aksi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            {h.sorotan.slice(0, 4).map(k => (
              <span key={k} className="chip" style={{ fontSize: 10.5, padding: '2px 7px' }}>{k}</span>
            ))}
            <span className="spacer" />
            {adaAncaman(p.ancaman) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>
                <IkonPalu size={11} /> {ringkasAncaman(p).slice(0, 46)}
                {ringkasAncaman(p).length > 46 ? '…' : ''}
              </span>
            )}
            <button
              className="btn btn-sm btn-ghost btn-icon"
              onClick={onSimpan}
              title={tersimpan ? 'Hapus bookmark' : 'Simpan pasal'}
              aria-label={tersimpan ? 'Hapus bookmark' : 'Simpan pasal'}
            >
              {tersimpan ? <IkonSimpanIsi size={14} style={{ color: 'var(--brand-600)' }} /> : <IkonSimpan size={14} />}
            </button>
            <button className="btn btn-sm" onClick={onBuka}>
              Buka pasal <IkonKanan size={13} />
            </button>
          </div>
        </div>
      </div>
    </Kartu>
  )
}
