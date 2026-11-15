/* ============================================================
   Pembaca Pasal
   Buku → Bab → Bagian → Paragraf → Pasal → Ayat → Huruf → Penjelasan
   Fitur: daftar isi, prev/next, lompat, bookmark, salin, bagikan,
   ukuran huruf, mode fokus, cetak, rujukan, catatan cepat, koreksi.
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import {
  sanitasiHtml, kutipPasal, kutipAyat, ringkasAncaman, adaAncaman,
  waktuRelatif, hitungKata, estimasiBaca,
} from '@/lib/format'
import { salin } from '@/lib/storage'
import { Kartu, Chip, Tombol, Modal, Kosong, Label } from '@/components/ui'
import {
  IkonKiri, IkonKanan, IkonSimpan, IkonSimpanIsi, IkonSalin, IkonBagikan,
  IkonCetak, IkonPerbesar, IkonPerkecil, IkonPerisai, IkonInfo, IkonPeringatan,
  IkonTautan, IkonCatatan, IkonTarget, IkonBawah, IkonJam, IkonPalu,
} from '@/components/Ikon'
import { pasalTerkait } from '@/features/mapping/relasi'

const LEVEL_UKURAN = [15, 17, 19, 22]
const LABEL_UKURAN = ['A', 'A', 'A', 'A']

export function Reader({ nomor }: { nomor: number }) {
  const navigasi = useStore(s => s.navigasi)
  const preferensi = useStore(s => s.preferensi)
  const setPreferensi = useStore(s => s.setPreferensi)
  const catatBaca = useStore(s => s.catatBaca)
  const toggleBookmark = useStore(s => s.toggleBookmark)
  const daftarBookmark = useStore(s => s.bookmark)
  const tampilkanToast = useStore(s => s.tampilkanToast)
  const tambahCatatan = useStore(s => s.tambahCatatan)
  const catatan = useStore(s => s.catatan)

  const pasal = db.get(nomor)
  const [lompat, setLompat] = useState('')
  const [modalSalin, setModalSalin] = useState<{ judul: string; isi: string } | null>(null)
  const [catatanBuka, setCatatanBuka] = useState(false)
  const [isiCatatan, setIsiCatatan] = useState('')
  const [tocBuka, setTocBuka] = useState(false)
  const refAwal = useRef<HTMLDivElement>(null)

  const { sebelum, sesudah } = db.tetangga(nomor)

  useEffect(() => {
    if (!pasal) return
    catatBaca(pasal.nomor)
    refAwal.current?.scrollIntoView({ block: 'start' })
    document.title = `Pasal ${pasal.nomor} — KUHP Digital`
  }, [nomor])

  /* navigasi keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'ArrowLeft' && sebelum) navigasi({ nama: 'baca', pasal: sebelum })
      if (e.key === 'ArrowRight' && sesudah) navigasi({ nama: 'baca', pasal: sesudah })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sebelum, sesudah, navigasi])

  const kata = useMemo(() => pasal ? hitungKata(pasal.teks) : 0, [pasal])

  if (!pasal) {
    return (
      <div className="konten-dalam">
        <Kosong
          ikon={<IkonPeringatan size={24} />}
          judul="Pasal tidak ditemukan"
          pesan={`Pasal ${nomor} tidak ada dalam KUHP (rentang 1–624).`}
          aksi={<Tombol nada="primary" onClick={() => navigasi({ nama: 'daftar-isi' })}>Buka Daftar Isi</Tombol>}
        />
      </div>
    )
  }

  const ditandai = daftarBookmark.some(b => b.pasal === pasal.nomor)
  const koreksi = db.koreksiPasal(pasal.nomor)
  const perujuk = db.perujuk(pasal.nomor)
  const terkait = pasalTerkait(pasal.nomor)
  const catatanPasal = catatan.filter(c => c.pasal === pasal.nomor)
  const fs = LEVEL_UKURAN[Math.min(3, Math.max(0, preferensi.ukuranHuruf))]

  const lakukanLompat = () => {
    const n = parseInt(lompat.replace(/\D/g, ''), 10)
    if (!n || n < 1 || n > 624) {
      tampilkanToast('Masukkan nomor pasal 1–624', 'galat')
      return
    }
    navigasi({ nama: 'baca', pasal: n })
    setLompat('')
    setTocBuka(false)
  }

  const bagikan = async () => {
    const teks = kutipPasal(pasal) + `\n\nSumber: ${db.meta.dasarHukum}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Pasal ${pasal.nomor} KUHP`, text: teks })
        return
      } catch { /* dibatalkan pengguna */ }
    }
    const ok = await salin(teks)
    tampilkanToast(ok ? 'Kutipan disalin ke papan klip' : 'Gagal menyalin', ok ? 'ok' : 'galat')
  }

  const simpanCatatan = () => {
    if (isiCatatan.trim().length < 2) return
    tambahCatatan({ pasal: pasal.nomor, isi: isiCatatan.trim() })
    setIsiCatatan('')
    setCatatanBuka(false)
    tampilkanToast('Catatan disimpan')
  }

  return (
    <div className="konten-dalam" ref={refAwal}>
      {/* ===== Bilah alat baca ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        <Tombol kecil ikon={<IkonKiri size={14} />} onClick={() => navigasi({ nama: 'daftar-isi' })}>
          Daftar Isi
        </Tombol>
        <Tombol kecil ikon={<IkonTarget size={14} />} onClick={() => setTocBuka(true)}>
          Lompat
        </Tombol>

        <span className="spacer" />

        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setPreferensi({ ukuranHuruf: Math.max(0, preferensi.ukuranHuruf - 1) })}
            aria-label="Perkecil huruf" title="Perkecil huruf"
            style={{ padding: '0 8px', color: 'var(--muted)' }}
          >
            <IkonPerkecil size={15} />
          </button>
          <span style={{ display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)', minWidth: 30 }}>
            {LABEL_UKURAN[Math.min(3, preferensi.ukuranHuruf)]}{preferensi.ukuranHuruf + 1}
          </span>
          <button
            onClick={() => setPreferensi({ ukuranHuruf: Math.min(3, preferensi.ukuranHuruf + 1) })}
            aria-label="Perbesar huruf" title="Perbesar huruf"
            style={{ padding: '0 8px', color: 'var(--muted)' }}
          >
            <IkonPerbesar size={15} />
          </button>
        </div>

        <Tombol
          kecil aktif={ditandai} ikon={ditandai ? <IkonSimpanIsi size={14} /> : <IkonSimpan size={14} />}
          onClick={() => {
            const aktif = toggleBookmark(pasal.nomor)
            tampilkanToast(aktif ? 'Ditambahkan ke bookmark' : 'Bookmark dihapus')
          }}
        >
          {ditandai ? 'Tersimpan' : 'Simpan'}
        </Tombol>
        <Tombol kecil ikon={<IkonCatatan size={14} />} onClick={() => setCatatanBuka(true)}>
          Catatan
        </Tombol>
        <Tombol kecil ikon={<IkonCetak size={14} />} onClick={() => window.print()}>
          Cetak
        </Tombol>
      </div>

      {/* ===== Kepala pasal ===== */}
      <div style={{ marginBottom: 8 }}>
        <div className="row-gap wrap" style={{ marginBottom: 8 }}>
          <Chip nada="brand">{pasal.buku === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'}</Chip>
          <Chip>Bab {pasal.bab}</Chip>
          {pasal.bagianJudul && <Chip>Bagian {pasal.bagian} — {pasal.bagianJudul}</Chip>}
          {pasal.paragraf && <Chip>Paragraf {pasal.paragraf}</Chip>}
          {pasal.adaKoreksi && (
            <Chip nada="warn" ikon={<IkonPerisai size={11} />} judul="Redaksi telah dikoreksi terhadap sumber resmi">
              Redaksi dikoreksi
            </Chip>
          )}
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
          {pasal.babJudul}
        </div>
        <h1 style={{
          fontSize: 27, fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.15, marginBottom: 6,
        }}>
          Pasal {pasal.nomor}
        </h1>
        <div className="row-gap" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          <IkonBawah size={12} style={{ transform: 'rotate(-90deg)' }} />
          {pasal.ayat.filter(a => a.nomor != null).length > 0
            ? `${pasal.ayat.filter(a => a.nomor != null).length} ayat`
            : 'tanpa penomoran ayat'}
          {pasal.ayat.some(a => a.huruf.length > 0) && ` · ${pasal.ayat.reduce((n, a) => n + a.huruf.length, 0)} huruf`}
          <span style={{ opacity: .5 }}>·</span>
          <IkonJam size={12} />
          {estimasiBaca(kata)}
        </div>
      </div>

      {/* ===== Redaksi resmi ===== */}
      <Kartu pad={0} style={{ marginTop: 14, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
          background: 'var(--brand-50)', borderBottom: '1px solid var(--border)',
        }}>
          <IkonPerisai size={14} style={{ color: 'var(--brand-700)' }} />
          <Label>Redaksi Resmi</Label>
          <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: 'var(--brand-700)' }}>
            VERBATIM
          </span>
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {pasal.ayat.length === 0 || (pasal.ayat.length === 1 && pasal.ayat[0].nomor == null && pasal.ayat[0].huruf.length === 0) ? (
            <div
              className="teks-pasal"
              style={{ fontSize: fs, lineHeight: preferensi.jarakBaris, fontFamily: 'var(--font-doc)' }}
              dangerouslySetInnerHTML={{ __html: sanitasiHtml(pasal.teks) }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pasal.ayat.map((a, i) => (
                <div key={i} id={a.nomor != null ? `ayat-${a.nomor}` : `blok-${i}`} style={{ scrollMarginTop: 70 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {a.nomor != null && (
                      <span style={{
                        fontFamily: 'var(--font-doc)', fontSize: fs, fontWeight: 700,
                        color: 'var(--brand-700)', flex: 'none', lineHeight: preferensi.jarakBaris,
                        minWidth: 26,
                      }}>
                        ({a.nomor})
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="teks-pasal"
                        style={{ fontSize: fs, lineHeight: preferensi.jarakBaris, fontFamily: 'var(--font-doc)' }}
                        dangerouslySetInnerHTML={{ __html: sanitasiHtml(a.teks) }}
                      />
                      {/* Daftar butir dirender dari HTML ayat bila sudah memuat <li>
                          (sumber tunggal, tidak digandakan). Salinan huruf[] hanya
                          dipakai untuk ayat yang teksnya belum memuat daftar. */}
                      {a.huruf.length > 0 && !/<li[\s>]/i.test(a.teks) && (
                        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {a.huruf.map((h, j) => (
                            <div key={j} style={{ display: 'flex', gap: 9, paddingLeft: 4 }}>
                              <span style={{
                                fontFamily: 'var(--font-doc)', fontSize: fs, fontWeight: 700,
                                color: 'var(--text-soft)', flex: 'none', lineHeight: preferensi.jarakBaris,
                              }}>
                                {h.label}.
                              </span>
                              <div
                                className="teks-pasal"
                                style={{
                                  fontSize: fs, lineHeight: preferensi.jarakBaris,
                                  fontFamily: 'var(--font-doc)', flex: 1, minWidth: 0,
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitasiHtml(h.teks) }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {a.nomor != null && (
                      <button
                        onClick={async () => {
                          const ok = await salin(kutipAyat(pasal, a.nomor!))
                          tampilkanToast(ok ? `Ayat (${a.nomor}) disalin` : 'Gagal menyalin', ok ? 'ok' : 'galat')
                        }}
                        title={`Salin ayat (${a.nomor})`}
                        aria-label={`Salin ayat ${a.nomor}`}
                        style={{ color: 'var(--muted)', opacity: .6, flex: 'none', padding: 4, alignSelf: 'flex-start' }}
                      >
                        <IkonSalin size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            <Tombol
              kecil ikon={<IkonSalin size={13} />}
              onClick={async () => {
                const ok = await salin(kutipPasal(pasal))
                tampilkanToast(ok ? 'Pasal disalin' : 'Gagal menyalin', ok ? 'ok' : 'galat')
              }}
            >
              Salin pasal
            </Tombol>
            <Tombol kecil ikon={<IkonBagikan size={13} />} onClick={bagikan}>Bagikan kutipan</Tombol>
            <Tombol kecil ikon={<IkonCetak size={13} />} onClick={() => window.print()}>Cetak pasal</Tombol>
          </div>
        </div>
      </Kartu>

      {/* ===== Ancaman pidana ===== */}
      {preferensi.tampilkanAncaman && adaAncaman(pasal.ancaman) && (
        <Kartu style={{ marginTop: 14 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonPalu size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Ancaman Pidana (ringkasan otomatis)</Label>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, fontWeight: 550, color: 'var(--text-soft)' }}>
            {ringkasAncaman(pasal)}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
            Ringkasan ini dihasilkan otomatis dari redaksi pasal, bukan pengganti teks resmi.
            Kategori denda mengacu pada Pasal 79 KUHP.
          </p>
        </Kartu>
      )}

      {/* ===== Penjelasan resmi ===== */}
      {preferensi.tampilkanPenjelasan && (
        <Kartu style={{ marginTop: 14 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonInfo size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Penjelasan Pasal</Label>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>
              dari lampiran undang-undang
            </span>
          </div>
          <div
            className="teks-penjelasan"
            style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-soft)' }}
            dangerouslySetInnerHTML={{ __html: sanitasiHtml(pasal.penjelasan) }}
          />
        </Kartu>
      )}

      {/* ===== Koreksi & integritas ===== */}
      {preferensi.tampilkanKoreksi && koreksi.length > 0 && (
        <Kartu style={{ marginTop: 14, borderColor: 'var(--warn)', background: 'var(--warn-bg)' }}>
          <div className="row-gap" style={{ marginBottom: 8 }}>
            <IkonPerisai size={15} style={{ color: 'var(--warn)' }} />
            <Label>Catatan Koreksi Redaksi ({koreksi.length})</Label>
          </div>
          {koreksi.map((k, i) => (
            <div key={i} style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-soft)', marginBottom: 8 }}>
              <b style={{ textTransform: 'capitalize' }}>{k.field}</b> · {k.jenis} ·{' '}
              <span style={{ textTransform: 'uppercase', fontSize: 10.5, fontWeight: 700 }}>{k.tingkat}</span>
              <div style={{ marginTop: 3 }}>{k.catatan}</div>
            </div>
          ))}
          <button
            onClick={() => navigasi({ nama: 'tentang' })}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)', marginTop: 2 }}
          >
            Lihat seluruh log koreksi →
          </button>
        </Kartu>
      )}

      {/* ===== Rujukan resmi ===== */}
      {preferensi.tampilkanRujukan && pasal.rujukan.length > 0 && (
        <Kartu style={{ marginTop: 14 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonTautan size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Rujukan Resmi Antar-Pasal ({pasal.rujukan.length})</Label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pasal.rujukan.map((r, i) => (
              <button
                key={i}
                onClick={() => navigasi({ nama: 'baca', pasal: r.pasal })}
                className="chip"
                style={{ cursor: 'pointer', fontSize: 12, padding: '5px 10px', fontWeight: 650 }}
              >
                Pasal {r.pasal}{r.ayat ? ` ayat (${r.ayat})` : ''}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 9, lineHeight: 1.6 }}>
            Rujukan diambil langsung dari penyebutan pasal lain dalam redaksi dan penjelasan pasal ini.
          </p>
        </Kartu>
      )}

      {/* ===== Perujuk (pasal lain yang merujuk ke sini) ===== */}
      {perujuk.length > 0 && (
        <Kartu style={{ marginTop: 14 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonKiri size={15} style={{ color: 'var(--muted)' }} />
            <Label>Dirujuk Oleh ({perujuk.length})</Label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {perujuk.slice(0, 24).map(p => (
              <button
                key={p.nomor}
                onClick={() => navigasi({ nama: 'baca', pasal: p.nomor })}
                className="chip"
                style={{ cursor: 'pointer', fontSize: 12, padding: '5px 10px', fontWeight: 650 }}
              >
                Pasal {p.nomor}
              </button>
            ))}
            {perujuk.length > 24 && (
              <span className="chip">+{perujuk.length - 24} lainnya</span>
            )}
          </div>
        </Kartu>
      )}

      {/* ===== Pasal terkait (analitis, bukan rujukan resmi) ===== */}
      {terkait.length > 0 && (
        <Kartu style={{ marginTop: 14, background: 'var(--surface-2)' }}>
          <div className="row-gap" style={{ marginBottom: 4 }}>
            <IkonTarget size={15} style={{ color: 'var(--muted)' }} />
            <Label>Pasal Terkait</Label>
            <Chip nada="netral" judul="Berdasarkan kemiripan kata kunci, bukan rujukan dalam undang-undang">saran</Chip>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
            Daftar ini disusun dari kemiripan kata kunci dan bukan bagian dari teks undang-undang.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {terkait.map(t => (
              <button
                key={t.pasal.nomor}
                onClick={() => navigasi({ nama: 'baca', pasal: t.pasal.nomor })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                  padding: '8px 10px', borderRadius: 8, background: 'var(--surface)',
                  border: '1px solid var(--border)', fontSize: 12.5,
                }}
              >
                <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', fontSize: 11.5 }}>
                  {t.pasal.nomor}
                </span>
                <span className="grow truncate" style={{ fontWeight: 550 }}>{t.pasal.babJudul}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>
                  {Math.round(t.skor * 100)}%
                </span>
              </button>
            ))}
          </div>
        </Kartu>
      )}

      {/* ===== Catatan pribadi pada pasal ini ===== */}
      {catatanPasal.length > 0 && (
        <Kartu style={{ marginTop: 14 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonCatatan size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Catatan Anda ({catatanPasal.length})</Label>
          </div>
          {catatanPasal.map(c => (
            <div key={c.id} style={{
              fontSize: 13, lineHeight: 1.65, padding: '9px 0',
              borderBottom: '1px solid var(--border)', color: 'var(--text-soft)',
            }}>
              {c.isi}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {waktuRelatif(c.diubah)}
              </div>
            </div>
          ))}
        </Kartu>
      )}

      {/* ===== Navigasi bawah ===== */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22,
      }}>
        {sebelum ? (
          <button className="card" onClick={() => navigasi({ nama: 'baca', pasal: sebelum })}
            style={{ padding: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
            <IkonKiri size={16} style={{ color: 'var(--muted)', flex: 'none' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.05em' }}>SEBELUMNYA</div>
              <div className="truncate" style={{ fontWeight: 700, fontSize: 13.5 }}>Pasal {sebelum}</div>
            </div>
          </button>
        ) : <div />}
        {sesudah ? (
          <button className="card" onClick={() => navigasi({ nama: 'baca', pasal: sesudah })}
            style={{ padding: 13, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.05em' }}>BERIKUTNYA</div>
              <div className="truncate" style={{ fontWeight: 700, fontSize: 13.5 }}>Pasal {sesudah}</div>
            </div>
            <IkonKanan size={16} style={{ color: 'var(--muted)', flex: 'none' }} />
          </button>
        ) : <div />}
      </div>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', marginTop: 18, lineHeight: 1.7 }}>
        Gunakan <span className="kbd">←</span> <span className="kbd">→</span> untuk berpindah pasal ·{' '}
        <span className="kbd">Ctrl</span>+<span className="kbd">K</span> untuk pencarian cepat
        <br />
        Sumber: {db.meta.dasarHukum}
      </div>

      {/* ===== Modal lompat ===== */}
      <Modal buka={tocBuka} onTutup={() => setTocBuka(false)} judul="Lompat ke Pasal" lebar={440}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input" value={lompat} autoFocus
            onChange={e => setLompat(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') lakukanLompat() }}
            placeholder="Nomor pasal (1–624)"
            inputMode="numeric"
            aria-label="Nomor pasal"
          />
          <Tombol nada="primary" onClick={lakukanLompat}>Buka</Tombol>
        </div>
        <div style={{ marginTop: 14 }}>
          <Label>Buku</Label>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <button className="chip" onClick={() => navigasi({ nama: 'baca', pasal: 1 })}>Pasal 1 (awal)</button>
            <button className="chip" onClick={() => navigasi({ nama: 'baca', pasal: 187 })}>Pasal 187 (akhir Buku Kesatu)</button>
            <button className="chip" onClick={() => navigasi({ nama: 'baca', pasal: 188 })}>Pasal 188 (awal Buku Kedua)</button>
            <button className="chip" onClick={() => navigasi({ nama: 'baca', pasal: 624 })}>Pasal 624 (akhir)</button>
          </div>
        </div>
      </Modal>

      {/* ===== Modal catatan cepat ===== */}
      <Modal buka={catatanBuka} onTutup={() => setCatatanBuka(false)} judul={`Catatan untuk Pasal ${pasal.nomor}`}>
        <textarea
          className="input" autoFocus value={isiCatatan}
          onChange={e => setIsiCatatan(e.target.value)}
          placeholder="Tulis analisis, pertanyaan, atau hal penting tentang pasal ini…"
          style={{ minHeight: 130 }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <Tombol onClick={() => setCatatanBuka(false)}>Batal</Tombol>
          <Tombol nada="primary" onClick={simpanCatatan}>Simpan catatan</Tombol>
        </div>
      </Modal>

      {/* ===== Modal salin (cadangan bila clipboard diblokir) ===== */}
      <Modal buka={!!modalSalin} onTutup={() => setModalSalin(null)} judul={modalSalin?.judul ?? 'Kutipan'}>
        <textarea className="input" readOnly value={modalSalin?.isi ?? ''} style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
      </Modal>
    </div>
  )
}
