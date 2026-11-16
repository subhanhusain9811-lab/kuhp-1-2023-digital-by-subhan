/* ============================================================
   Sumber & Integritas
   Menjelaskan asal data, metode koreksi, dan menampilkan log koreksi
   secara terbuka (transparansi adalah bagian dari produk).
   ============================================================ */
import { useMemo, useState } from 'react'
import { db, htmlKeTeks } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { Kartu, Chip, Label, Segmen, Info } from '@/components/ui'
import { KartuKredit } from '@/components/KartuKredit'
import { labelBerlakuLengkap, DASAR_BERLAKU } from '@/lib/statusBerlaku'
import {
  IkonPerisai, IkonInfo, IkonBerkas, IkonCentang, IkonPeringatan,
  IkonCari, IkonGrafik, IkonSkala, IkonTutup, IkonKanan,
} from '@/components/Ikon'

export function AboutPage() {
  const navigasi = useStore(s => s.navigasi)
  const st = db.meta.statistik
  const log = db.koreksi.log

  const [tab, setTab] = useState<'ringkas' | 'koreksi'>('ringkas')
  const [q, setQ] = useState('')
  const [filterField, setFilterField] = useState<'semua' | 'teks' | 'penjelasan'>('semua')

  const logTampil = useMemo(() => {
    let arr = log
    if (filterField !== 'semua') arr = arr.filter(k => k.field === filterField)
    const t = q.trim().toLowerCase()
    if (t) {
      arr = arr.filter(k =>
        String(k.pasal).includes(t) ||
        k.catatan.toLowerCase().includes(t) ||
        k.jenis.toLowerCase().includes(t),
      )
    }
    return [...arr].sort((a, b) => a.pasal - b.pasal)
  }, [log, q, filterField])

  const perField = {
    teks: log.filter(k => k.field === 'teks').length,
    penjelasan: log.filter(k => k.field === 'penjelasan').length,
  }

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <div className="row-gap" style={{ marginBottom: 5 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'var(--ok-bg)', color: 'var(--ok)',
          }}><IkonPerisai size={18} /></div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em' }}>Sumber & Integritas Data</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 720 }}>
          Aplikasi ini dibangun di atas teks resmi UU No. 1 Tahun 2023. Setiap penyimpangan yang
          ditemukan pada berkas sumber dicatat dan dapat Anda periksa sendiri di halaman ini.
        </p>
      </div>

      <Segmen<'ringkas' | 'koreksi'>
        nilai={tab} label="Bagian informasi"
        opsi={[
          { nilai: 'ringkas', label: 'Ringkasan & Metode' },
          { nilai: 'koreksi', label: `Log Koreksi (${log.length})` },
        ]}
        onUbah={setTab}
      />

      {tab === 'ringkas' && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Kartu>
            <div className="row-gap" style={{ marginBottom: 10 }}>
              <IkonBerkas size={15} style={{ color: 'var(--brand-700)' }} />
              <Label>Identitas Undang-Undang</Label>
            </div>
            <Info label="Dasar hukum" nilai={db.meta.dasarHukum} />
            <Info label="Diundangkan" nilai={db.meta.diundangkan} />
            <Info label="Lembaran Negara" nilai={db.meta.lembaranNegara} />
            <Info label="Mulai berlaku" nilai={labelBerlakuLengkap()} />
            <Info label="Dasar" nilai={DASAR_BERLAKU} />
            <Info label="Versi data" nilai={`${db.meta.versiData} · ${db.meta.tanggalBangun}`} />
          </Kartu>

          <Kartu>
            <div className="row-gap" style={{ marginBottom: 10 }}>
              <IkonGrafik size={15} style={{ color: 'var(--brand-700)' }} />
              <Label>Cakupan Dataset</Label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 9 }}>
              {[
                ['Buku', st.buku], ['Bab', st.bab], ['Bagian', st.bagian], ['Paragraf', st.paragraf],
                ['Pasal', st.pasal], ['Ayat', st.ayat], ['Huruf', st.huruf],
                ['Rujukan silang', st.rujukanSilang],
              ].map(([l, n]) => (
                <div key={l as string} style={{
                  padding: '9px 11px', borderRadius: 9, background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em' }}>{n as number}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>{l as string}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.65 }}>
              {st.kataRedaksi.toLocaleString('id-ID')} kata redaksi · {st.kataPenjelasan.toLocaleString('id-ID')} kata penjelasan ·{' '}
              {st.penjelasanCukupJelas} penjelasan berkategori "cukup jelas"
            </div>
          </Kartu>

          <Kartu>
            <div className="row-gap" style={{ marginBottom: 10 }}>
              <IkonSkala size={15} style={{ color: 'var(--brand-700)' }} />
              <Label>Sumber & Metode Verifikasi</Label>
            </div>
            <Info label="Sumber utama" nilai={db.meta.sumber.utama} />
            <Info label="Pembanding" nilai={db.meta.sumber.verifikasi} />
            <Info label="Metode" nilai={db.meta.sumber.metode} />
            <div style={{
              marginTop: 12, display: 'flex', gap: 8, padding: '10px 12px',
              background: 'var(--ok-bg)', borderRadius: 9, color: 'var(--ok)',
              fontSize: 11.5, fontWeight: 600, lineHeight: 1.6,
            }}>
              <IkonCentang size={14} style={{ flex: 'none', marginTop: 1 }} />
              <span>
                Redaksi pasal disajikan tanpa parafrase. Aplikasi tidak menambahkan, mengurangi,
                atau menggabungkan ketentuan; bila berkas sumber keliru, koreksinya dicatat pada log
                dan ditandai pada pasal terkait.
              </span>
            </div>
          </Kartu>

          <Kartu style={{ background: 'var(--warn-bg)', borderColor: 'var(--warn)' }}>
            <div className="row-gap" style={{ marginBottom: 8 }}>
              <IkonPeringatan size={15} style={{ color: 'var(--warn)' }} />
              <Label>Batas Penggunaan</Label>
            </div>
            <ul style={{ margin: 0, paddingLeft: 17, fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.75 }}>
              <li>Fitur semantik, pasal terkait, matriks unsur, ringkasan ancaman, dan keluaran asisten
                  adalah <b>alat bantu</b> — bukan teks undang-undang dan bukan nasihat hukum.</li>
              <li>Kutipan resmi selalu diberi label "redaksi resmi" dan dapat dibandingkan langsung
                  dengan lembaran negara.</li>
              <li>Kategori doktrin (mis. alasan pembenar/pemaaf) tidak boleh dikutip seolah-olah
                  merupakan judul atau bunyi pasal.</li>
              <li>Untuk keperluan resmi, rujuk {db.meta.lembaranNegara}.</li>
            </ul>
          </Kartu>

          <Kartu>
            <div className="row-gap" style={{ marginBottom: 10 }}>
              <IkonInfo size={15} style={{ color: 'var(--muted)' }} />
              <Label>Tentang Aplikasi</Label>
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--text-soft)' }}>
              <b>KUHP DIGITAL</b> — {db.meta.tagline}<br />
              Dibangun sebagai aplikasi web statis: seluruh data hukum dan mesin pencarian
              berjalan di peramban, tanpa server dan tanpa API berbayar. Data pengguna
              (bookmark, catatan, analisis, riwayat) hanya tersimpan di perangkat.
              <div style={{ marginTop: 9, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Chip nada="brand">8 modul</Chip>
                <Chip nada="ok">100% offline-ready</Chip>
                <Chip>tanpa API eksternal</Chip>
                <Chip>{st.pasal} pasal</Chip>
              </div>
            </div>
          </Kartu>

          <KartuKredit />
        </div>
      )}

      {tab === 'koreksi' && (
        <div style={{ marginTop: 16 }}>
          <Kartu style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-soft)' }}>
              Terdapat <b>{log.length} koreksi</b> pada {st.pasalDikoreksi} pasal:
              {' '}{perField.teks} koreksi redaksi dan {perField.penjelasan} koreksi penjelasan.
              Koreksi diterapkan hanya bila redaksi resmi dan sumber pembanding sepakat;
              setiap entri memuat kutipan berkas sumber dan redaksi resmi yang dipakai.
            </div>
          </Kartu>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <Segmen<'semua' | 'teks' | 'penjelasan'>
              nilai={filterField} label="Saring jenis koreksi"
              opsi={[
                { nilai: 'semua', label: `Semua (${log.length})` },
                { nilai: 'teks', label: `Redaksi (${perField.teks})` },
                { nilai: 'penjelasan', label: `Penjelasan (${perField.penjelasan})` },
              ]}
              onUbah={setFilterField}
            />
            <div className="topbar-cari" style={{ flex: 1, minWidth: 160, maxWidth: 280 }}>
              <IkonCari size={14} className="ikon-cari" />
              <input className="input" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Saring nomor pasal atau catatan…" aria-label="Saring log koreksi"
                style={{ minHeight: 34, paddingLeft: 31, fontSize: 12.5 }} />
              {q && (
                <button onClick={() => setQ('')} aria-label="Bersihkan"
                  style={{ position: 'absolute', right: 9, color: 'var(--muted)' }}>
                  <IkonTutup size={13} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {logTampil.map((k, i) => (
              <Kartu key={i} pad={0} style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
                  background: k.field === 'teks' ? 'var(--warn-bg)' : 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <button onClick={() => navigasi({ nama: 'baca', pasal: k.pasal })}
                    style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-700)' }}>
                    Pasal {k.pasal}
                  </button>
                  <Chip nada={k.field === 'teks' ? 'warn' : 'netral'}>{k.field}</Chip>
                  <Chip>{k.jenis}</Chip>
                  <span className="spacer" />
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {k.tingkat}
                  </span>
                  <IkonKanan size={12} style={{ color: 'var(--muted)' }} />
                </div>
                <div style={{ padding: '10px 13px' }}>
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-soft)', marginBottom: 9 }}>
                    {k.catatan}
                  </p>
                  <div className="grid-2" style={{ gap: 8 }}>
                    <div style={{
                      padding: '8px 10px', borderRadius: 8, background: 'var(--danger-bg)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', color: 'var(--danger)', marginBottom: 3 }}>
                        BERKAS SUMBER
                      </div>
                      <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', lineHeight: 1.6, color: 'var(--text-soft)', wordBreak: 'break-word' }}>
                        {k.redaksiFile || '—'}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 10px', borderRadius: 8, background: 'var(--ok-bg)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', color: 'var(--ok)', marginBottom: 3 }}>
                        REDAKSI RESMI DIPAKAI
                      </div>
                      <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', lineHeight: 1.6, color: 'var(--text-soft)', wordBreak: 'break-word' }}>
                        {k.redaksiResmi || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </Kartu>
            ))}
          </div>

          {logTampil.length === 0 && (
            <Kartu>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
                Tidak ada entri koreksi yang cocok dengan saringan.
              </div>
            </Kartu>
          )}
        </div>
      )}

      <Kartu style={{ marginTop: 18, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
          <IkonPerisai size={13} style={{ flex: 'none', marginTop: 2 }} />
          <span>
            Halaman ini adalah bagian dari komitmen transparansi: pengguna berhak mengetahui
            perbedaan apa pun antara berkas sumber yang beredar dan redaksi resmi yang dipakai aplikasi.
            Contoh redaksi pasal: {htmlKeTeks(db.get(476)?.teks ?? '').slice(0, 90)}…
          </span>
        </div>
      </Kartu>
    </div>
  )
}
