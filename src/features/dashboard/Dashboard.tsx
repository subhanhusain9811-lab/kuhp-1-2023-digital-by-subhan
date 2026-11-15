/* ============================================================
   Beranda — identitas, pencarian utama, statistik, daftar isi
   interaktif, lanjut baca, favorit, riwayat pencarian, akses cepat.
   ============================================================ */
import { useMemo, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { cari, SARAN_POPULER } from '@/search/query'
import { waktuRelatif, htmlKeTeks } from '@/lib/format'
import { Kartu, Chip, Tombol, Kosong, Label } from '@/components/ui'
import {
  IkonCari, IkonKanan, IkonBuku, IkonJam, IkonSimpan, IkonPalu,
  IkonPetir, IkonTopik, IkonInfo, IkonPerisai, IkonBerkas, IkonDaftar,
} from '@/components/Ikon'

export function Dashboard() {
  const navigasi = useStore(s => s.navigasi)
  const riwayat = useStore(s => s.riwayat)
  const bookmark = useStore(s => s.bookmark)
  const riwayatCari = useStore(s => s.riwayatCari)
  const [q, setQ] = useState('')
  const [bukuBuka, setBukuBuka] = useState<string | null>('BUKU KEDUA')

  const st = db.meta.statistik

  const saran = useMemo(() => {
    if (q.trim().length < 2) return []
    return cari(q, { batas: 5 })
  }, [q])

  const kirim = (teks: string) => {
    const t = teks.trim()
    if (!t) return
    navigasi({ nama: 'cari', q: t })
  }

  const terakhir = riwayat[0]
  const pasalTerakhir = terakhir ? db.get(terakhir.pasal) : undefined

  const favorit = bookmark.slice(0, 4).map(b => db.get(b.pasal)).filter(Boolean)

  return (
    <div className="konten-dalam anim-up">
      {/* ===== Hero ===== */}
      <section
        style={{
          position: 'relative',
          borderRadius: 20,
          padding: '30px 26px 26px',
          // Lapisan: (1) lapisan gelap di sisi teks agar teks putih ≥4.5:1,
          // (2) cincin cahaya Telegram-blue di kanan, (3) alas gradien pekat.
          background:
            'linear-gradient(105deg, rgba(15,23,42,.86) 0%, rgba(30,58,138,.62) 42%, rgba(30,58,138,.15) 75%, rgba(15,23,42,0) 100%),'
            + 'radial-gradient(115% 125% at 90% 8%, rgba(245,158,11,.42) 0%, rgba(245,158,11,.14) 45%, rgba(245,158,11,0) 68%),'
            + 'radial-gradient(95% 95% at 98% 100%, rgba(59,130,246,.32) 0%, rgba(59,130,246,0) 62%),'
            + 'linear-gradient(120deg, #0F172A 0%, #1E3A8A 52%, #1D4ED8 100%)',
          color: '#fff',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(15, 23, 42, .28)',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', right: -40, top: -60, width: 260, height: 260,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,.14)',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '4px 11px', borderRadius: 99, marginBottom: 14,
            background: 'rgba(255,255,255,.20)', fontSize: 11,
            fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
          }}>
            <IkonPerisai size={13} /> Undang-Undang Nomor 1 Tahun 2023
          </div>

          <h1 style={{
            fontSize: 30, lineHeight: 1.14, fontWeight: 800,
            letterSpacing: '-.025em', marginBottom: 8, maxWidth: 680,
          }}>
            KUHP Digital <span style={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.82em' }}>by Subhan</span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: .93, maxWidth: 540, fontWeight: 500 }}>
            Pusat Referensi Hukum Pidana dalam Satu Genggaman.{' '}
            <span style={{ opacity: .9 }}>{st.pasal} pasal, redaksi verbatim, dan pencarian hibrida.</span>
          </p>

          {/* Kotak pencarian utama */}
          <div style={{ position: 'relative', marginTop: 20, maxWidth: 620 }}>
            <form onSubmit={e => { e.preventDefault(); kirim(q) }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fff', borderRadius: 13, padding: '4px 4px 4px 14px',
                boxShadow: '0 6px 20px rgba(0,0,0,.16)',
              }}>
                <IkonCari size={19} style={{ color: 'var(--brand-700)', flex: 'none' }} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Cari pasal, kata kunci, atau perbuatan hukum…"
                  aria-label="Kotak pencarian utama"
                  style={{
                    flex: 1, minWidth: 0, border: 0, outline: 'none',
                    fontSize: 15, color: '#16222E', background: 'transparent', padding: '9px 0',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minHeight: 38, padding: '0 16px', borderRadius: 10 }}
                >
                  Cari
                </button>
              </div>
            </form>

            {/* Pratinjau hasil langsung */}
            {saran.length > 0 && (
              <div className="anim-pop" style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 20,
                background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)', overflow: 'hidden', textAlign: 'left',
              }}>
                {saran.map(h => (
                  <button
                    key={h.pasal.nomor}
                    onClick={() => navigasi({ nama: 'baca', pasal: h.pasal.nomor })}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', width: '100%',
                      padding: '10px 13px', borderBottom: '1px solid var(--border)',
                      color: 'var(--text)', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                      background: 'var(--brand-50)', color: 'var(--brand-700)',
                      padding: '2px 7px', borderRadius: 6, flex: 'none',
                    }}>{h.pasal.nomor}</span>
                    <span className="grow truncate" style={{ fontSize: 13, fontWeight: 550 }}>
                      {h.pasal.babJudul}
                    </span>
                    <IkonKanan size={14} style={{ color: 'var(--muted)' }} />
                  </button>
                ))}
                <div style={{ padding: '9px 13px', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                  Lihat semua hasil →
                </div>
              </div>
            )}
          </div>

          {/* Saran cepat */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            <span style={{ fontSize: 12, opacity: .8, fontWeight: 600, alignSelf: 'center' }}>Populer:</span>
            {SARAN_POPULER.slice(0, 6).map(s => (
              <button
                key={s}
                onClick={() => kirim(s)}
                style={{
                  padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: 650,
                  background: 'rgba(255,255,255,.20)', color: '#fff',
                  border: '1px solid rgba(255,255,255,.42)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Statistik ===== */}
      <section style={{ marginTop: 20 }}>
        <div className="grid-4">
          <StatAngka angka={st.buku} label="Buku" ikon={<IkonBuku size={17} />} />
          <StatAngka angka={st.bab} label="Bab" ikon={<IkonTopik size={17} />} />
          <StatAngka angka={st.bagian + st.paragraf} label="Bagian & Paragraf" ikon={<IkonDaftar size={17} />} />
          <StatAngka angka={st.pasal} label="Pasal" ikon={<IkonPalu size={17} />} utama />
        </div>
        <div className="grid-4" style={{ marginTop: 12 }}>
          <StatAngka angka={st.ayat} label="Ayat" />
          <StatAngka angka={st.huruf} label="Huruf" />
          <StatAngka angka={st.rujukanSilang} label="Rujukan Silang" />
          <StatAngka angka={st.kataRedaksi} label="Kata Redaksi" format />
        </div>
      </section>

      {/* ===== Lanjut baca / Favorit ===== */}
      <div className="grid-2" style={{ marginTop: 22, alignItems: 'start' }}>
        <div>
          <div className="sek">
            <h2>Lanjutkan Membaca</h2>
            {riwayat.length > 0 && (
              <button className="btn btn-sm btn-ghost sek-aksi" onClick={() => navigasi({ nama: 'pustaka' })}>
                Semua riwayat <IkonKanan size={14} />
              </button>
            )}
          </div>

          {pasalTerakhir ? (
            <Kartu pad={0} style={{ overflow: 'hidden' }}>
              <button
                onClick={() => navigasi({ nama: 'baca', pasal: pasalTerakhir.nomor })}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: 16 }}
              >
                <div className="row-gap" style={{ marginBottom: 8 }}>
                  <Chip nada="brand"><IkonJam size={11} /> {waktuRelatif(terakhir.dibaca)}</Chip>
                  <Chip>Bab {pasalTerakhir.bab}</Chip>
                </div>
                <div style={{ fontWeight: 750, fontSize: 16, marginBottom: 4 }}>
                  Pasal {pasalTerakhir.nomor}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 650, letterSpacing: '.02em', marginBottom: 8 }}>
                  {pasalTerakhir.babJudul}
                </div>
                <p style={{
                  fontFamily: 'var(--font-doc)', fontSize: 14, lineHeight: 1.62,
                  color: 'var(--text-soft)', margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {htmlKeTeks(pasalTerakhir.teks)}
                </p>
                <div className="row-gap" style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)' }}>
                    Lanjutkan membaca
                  </span>
                  <IkonKanan size={14} style={{ color: 'var(--brand-700)' }} />
                </div>
              </button>
            </Kartu>
          ) : (
            <Kartu>
              <Kosong
                ikon={<IkonBuku size={24} />}
                judul="Belum ada riwayat baca"
                pesan="Buka pasal mana pun; riwayat akan muncul di sini agar Anda bisa melanjutkan."
                aksi={
                  <Tombol nada="primary" onClick={() => navigasi({ nama: 'baca', pasal: 1 })}>
                    Mulai dari Pasal 1
                  </Tombol>
                }
              />
            </Kartu>
          )}

          {riwayat.length > 1 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {riwayat.slice(1, 4).map(r => {
                const p = db.get(r.pasal)
                if (!p) return null
                return (
                  <button
                    key={r.pasal}
                    className="card"
                    onClick={() => navigasi({ nama: 'baca', pasal: r.pasal })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', textAlign: 'left', fontSize: 13,
                    }}
                  >
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', fontSize: 12 }}>
                      {r.pasal}
                    </span>
                    <span className="grow truncate" style={{ fontWeight: 550 }}>{p.babJudul}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{waktuRelatif(r.dibaca)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div className="sek">
            <h2>Favorit & Bookmark</h2>
            {bookmark.length > 0 && (
              <button className="btn btn-sm btn-ghost sek-aksi" onClick={() => navigasi({ nama: 'pustaka' })}>
                Kelola <IkonKanan size={14} />
              </button>
            )}
          </div>

          {favorit.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {favorit.map(p => p && (
                <button
                  key={p.nomor}
                  className="card"
                  onClick={() => navigasi({ nama: 'baca', pasal: p.nomor })}
                  style={{ textAlign: 'left', padding: 12, display: 'block' }}
                >
                  <div className="row-gap" style={{ marginBottom: 4 }}>
                    <IkonSimpan size={13} style={{ color: 'var(--brand-600)' }} />
                    <span style={{ fontWeight: 750, fontSize: 14 }}>Pasal {p.nomor}</span>
                    <span className="grow" />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                      {p.ayat.length > 1 ? `${p.ayat.length} ayat` : '1 ayat'}
                    </span>
                  </div>
                  <div className="truncate" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                    {p.babJudul}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Kartu>
              <Kosong
                ikon={<IkonSimpan size={24} />}
                judul="Belum ada bookmark"
                pesan="Tandai pasal penting agar mudah dibuka kembali kapan saja."
              />
            </Kartu>
          )}

          {riwayatCari.length > 0 && (
            <>
              <div className="sek"><h2>Riwayat Pencarian</h2></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {riwayatCari.slice(0, 8).map(qq => (
                  <button
                    key={qq}
                    onClick={() => kirim(qq)}
                    className="chip"
                    style={{ cursor: 'pointer', fontSize: 12, padding: '5px 11px' }}
                  >
                    <IkonCari size={11} /> {qq}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== Daftar isi interaktif ===== */}
      <div className="sek" style={{ marginTop: 30 }}>
        <h2>Daftar Isi Interaktif</h2>
        <button className="btn btn-sm btn-ghost sek-aksi" onClick={() => navigasi({ nama: 'daftar-isi' })}>
          Struktur lengkap <IkonKanan size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {db.meta.bukuDaftar.map(buku => {
          const bab = db.hierarki.filter(b => b.buku === buku.kode)
          const buka = bukuBuka === buku.kode
          return (
            <Kartu key={buku.kode} pad={0} style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setBukuBuka(buka ? null : buku.kode)}
                aria-expanded={buka}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                  padding: '14px 16px', textAlign: 'left',
                  background: buka ? 'var(--brand-50)' : 'transparent',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
                  background: buka ? 'var(--brand-500)' : 'var(--surface-2)',
                  color: buka ? '#fff' : 'var(--muted)', flex: 'none',
                }}>
                  <IkonBuku size={17} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, fontSize: 14 }}>
                    {buku.kode === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'} — {buku.judul}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                    Pasal {buku.mulai}–{buku.selesai} · {buku.jumlahBab} bab
                  </div>
                </div>
                <IkonKanan
                  size={16}
                  style={{
                    color: 'var(--muted)',
                    transform: buka ? 'rotate(90deg)' : 'none',
                    transition: 'transform 200ms var(--ease)',
                  }}
                />
              </button>

              {buka && (
                <div className="anim-fade" style={{ padding: '6px 10px 12px' }}>
                  {bab.map(b => (
                    <BabBaris key={b.kode} bab={b} />
                  ))}
                </div>
              )}
            </Kartu>
          )
        })}
      </div>

      {/* ===== Akses cepat ===== */}
      <div className="sek"><h2>Akses Cepat</h2></div>
      <div className="grid-3">
        <AksesCepat
          ikon={<IkonPetir size={18} />}
          judul="Asisten Hukum"
          isi="Jelaskan pasal, temukan dasar hukum dari fakta, susun matriks unsur."
          onClick={() => navigasi({ nama: 'asisten' })}
        />
        <AksesCepat
          ikon={<IkonTopik size={18} />}
          judul="Pemetaan Hukum"
          isi="Kelompokkan pasal berdasarkan unsur, subjek, dan jenis ancaman."
          onClick={() => navigasi({ nama: 'pemetaan' })}
        />
        <AksesCepat
          ikon={<IkonBerkas size={18} />}
          judul="Ekspor & Cetak"
          isi="Unduh teks resmi atau cetak pasal dalam tata letak dokumen."
          onClick={() => navigasi({ nama: 'ekspor' })}
        />
      </div>

      {/* ===== Sumber & versi ===== */}
      <Kartu kelas="anim-fade" style={{ marginTop: 24, background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <IkonInfo size={16} style={{ color: 'var(--brand-700)' }} />
          <Label>Sumber & Versi Data</Label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 20px', fontSize: 12.5, lineHeight: 1.6 }}>
          <div><b>Dasar hukum:</b> {db.meta.dasarHukum}</div>
          <div><b>Diundangkan:</b> {db.meta.diundangkan}</div>
          <div><b>Lembaran Negara:</b> {db.meta.lembaranNegara}</div>
          <div><b>Mulai berlaku:</b> {db.meta.mulaiBerlaku}</div>
          <div><b>Versi data:</b> {db.meta.versiData} ({db.meta.tanggalBangun})</div>
          <div><b>Penjelasan:</b> {st.kataPenjelasan.toLocaleString('id-ID')} kata</div>
        </div>
        <hr className="divider" style={{ margin: '12px 0' }} />
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>
          Redaksi pasal disajikan verbatim. {st.pasalDikoreksi} pasal memuat koreksi terhadap berkas sumber
          yang terdokumentasi pada log koreksi. Data pengguna (bookmark, catatan, riwayat) disimpan
          hanya di perangkat Anda.
        </p>
      </Kartu>
    </div>
  )
}

/* ---------- Sub-komponen ---------- */
function StatAngka({
  angka, label, ikon, utama, format,
}: { angka: number; label: string; ikon?: React.ReactNode; utama?: boolean; format?: boolean }) {
  return (
    <Kartu pad={13} style={utama ? { borderColor: 'var(--brand-200)', background: 'var(--brand-50)' } : undefined}>
      <div className="row-gap" style={{ marginBottom: 5 }}>
        {ikon && <span style={{ color: utama ? 'var(--brand-700)' : 'var(--muted)', display: 'flex' }}>{ikon}</span>}
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
          color: utama ? 'var(--brand-700)' : 'var(--muted)',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 24, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1,
        color: utama ? 'var(--brand-700)' : 'var(--text)',
      }}>
        {format ? angka.toLocaleString('id-ID') : angka}
      </div>
    </Kartu>
  )
}

function BabBaris({ bab }: { bab: (typeof db.hierarki)[number] }) {
  const navigasi = useStore(s => s.navigasi)
  const [buka, setBuka] = useState(false)
  const punyaSub = bab.bagian.some(b => b.judul || b.paragraf.length)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => navigasi({ nama: 'baca', pasal: bab.mulai })}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0,
            padding: '8px 9px', borderRadius: 8, textAlign: 'left',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: 'var(--brand-700)', background: 'var(--brand-50)',
            padding: '2px 6px', borderRadius: 5, flex: 'none', minWidth: 30, textAlign: 'center',
          }}>{bab.kode}</span>
          <span className="grow truncate" style={{ fontSize: 13, fontWeight: 600 }}>{bab.judul}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, flex: 'none' }}>
            {bab.mulai}–{bab.selesai}
          </span>
        </button>
        {punyaSub && (
          <button
            onClick={() => setBuka(!buka)}
            aria-expanded={buka}
            aria-label={`Buka bagian bab ${bab.kode}`}
            style={{ padding: 6, color: 'var(--muted)' }}
          >
            <IkonKanan size={13} style={{ transform: buka ? 'rotate(90deg)' : 'none', transition: 'transform 180ms var(--ease)' }} />
          </button>
        )}
      </div>

      {buka && (
        <div className="anim-fade" style={{ paddingLeft: 42, paddingBottom: 6 }}>
          {bab.bagian.map((bg, i) => (
            <div key={i} style={{ padding: '4px 0' }}>
              <button
                onClick={() => { if (bg.mulai) navigasi({ nama: 'baca', pasal: bg.mulai }) }}
                style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-soft)', fontWeight: 600, width: '100%' }}
              >
                {bg.nama ? `Bagian ${bg.nama}` : 'Tanpa bagian'}
                {bg.judul ? ` — ${bg.judul}` : ''}
                {bg.mulai ? <span style={{ color: 'var(--muted)', fontWeight: 500 }}> (Pasal {bg.mulai}–{bg.selesai})</span> : null}
              </button>
              {bg.paragraf.length > 0 && (
                <div style={{ paddingLeft: 12, marginTop: 3 }}>
                  {bg.paragraf.map(pg => (
                    <button
                      key={pg.no}
                      onClick={() => { if (pg.pasal[0]) navigasi({ nama: 'baca', pasal: pg.pasal[0] }) }}
                      style={{ display: 'block', textAlign: 'left', fontSize: 11.5, color: 'var(--muted)', fontWeight: 550, padding: '2px 0' }}
                    >
                      Paragraf {pg.no} — {pg.judul}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AksesCepat({
  ikon, judul, isi, onClick,
}: { ikon: React.ReactNode; judul: string; isi: string; onClick: () => void }) {
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        textAlign: 'left', padding: 15, display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'transform 160ms var(--ease), box-shadow 160ms var(--ease), border-color 160ms var(--ease)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--brand-200)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
        background: 'var(--brand-50)', color: 'var(--brand-700)',
      }}>{ikon}</div>
      <div style={{ fontWeight: 750, fontSize: 14 }}>{judul}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{isi}</div>
    </button>
  )
}
