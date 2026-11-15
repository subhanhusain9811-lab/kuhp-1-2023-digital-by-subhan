/* ============================================================
   Asisten Hukum — antarmuka penyedia lokal
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { penyediaLokal, LABEL_PERAN, CONTOH_TUGAS, deteksiTugas, type JawabanAI, type Blok } from './provider'
import { Kartu, Chip, Tombol, Label } from '@/components/ui'
import {
  IkonAsisten, IkonPetir, IkonPerisai, IkonInfo, IkonPeringatan,
  IkonKanan, IkonSalin, IkonTarget, IkonTutup, IkonTambah, IkonSkala,
} from '@/components/Ikon'
import { salin } from '@/lib/storage'

const WARNA_PERAN: Record<Blok['peran'], { bg: string; fg: string; ikon: React.ReactNode }> = {
  fakta: { bg: 'var(--surface-2)', fg: 'var(--text-soft)', ikon: <IkonInfo size={13} /> },
  hukum: { bg: 'var(--ok-bg)', fg: 'var(--ok)', ikon: <IkonPerisai size={13} /> },
  analisis: { bg: 'var(--brand-50)', fg: 'var(--brand-700)', ikon: <IkonTarget size={13} /> },
  peringatan: { bg: 'var(--warn-bg)', fg: 'var(--warn)', ikon: <IkonPeringatan size={13} /> },
  catatan: { bg: 'var(--surface-2)', fg: 'var(--muted)', ikon: <IkonInfo size={13} /> },
}

export function AssistantPage() {
  const navigasi = useStore(s => s.navigasi)
  const tampilkanToast = useStore(s => s.tampilkanToast)

  const [input, setInput] = useState('')
  const [jawaban, setJawaban] = useState<JawabanAI | null>(null)
  const [proses, setProses] = useState(false)
  const [riwayat, setRiwayat] = useState<{ q: string; a: JawabanAI }[]>([])
  const refHasil = useRef<HTMLDivElement>(null)

  const jalankan = (teks: string, paksaTugas?: string) => {
    const t = teks.trim()
    if (t.length < 3) { tampilkanToast('Tulis pertanyaan atau fakta terlebih dahulu', 'info'); return }
    setProses(true)
    const tugas = (paksaTugas as ReturnType<typeof deteksiTugas>) ?? deteksiTugas(t)
    // beri jeda singkat agar indikator proses terlihat & UI tidak tersendat
    setTimeout(() => {
      const a = penyediaLokal.lakukan(tugas, t)
      setJawaban(a)
      setRiwayat(r => [{ q: t, a }, ...r].slice(0, 6))
      setProses(false)
    }, 160)
  }

  useEffect(() => {
    if (jawaban) refHasil.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [jawaban])

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 14 }}>
        <div className="row-gap" style={{ marginBottom: 5 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(145deg, var(--aksen-1), var(--aksen-2))', color: '#fff',
          }}>
            <IkonAsisten size={18} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em' }}>Asisten Hukum</h1>
          <Chip nada="ok" ikon={<IkonPerisai size={10} />}>100% lokal</Chip>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 720 }}>
          {penyediaLokal.deskripsi} Setiap pernyataan hukum selalu disertai nomor pasal; fakta, dasar
          hukum, dan analisis ditampilkan terpisah. Bila tidak ada dasar dalam KUHP, asisten akan
          menyatakannya — bukan menyusun jawaban tanpa rujukan.
        </p>
      </div>

      {/* Input */}
      <Kartu pad={14} style={{ marginBottom: 14 }}>
        <textarea
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); jalankan(input) }
          }}
          placeholder="Uraikan fakta atau ajukan pertanyaan, misalnya:&#10;• Mengambil barang milik orang lain tanpa izin dengan maksud memiliki&#10;• Jelaskan pasal 476&#10;• Bandingkan pasal 476 dan 486&#10;• Matriks unsur pasal 459"
          style={{ minHeight: 84, fontSize: 13.5, marginBottom: 10 }}
          aria-label="Pertanyaan untuk asisten hukum"
        />
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          <Tombol nada="primary" ikon={<IkonPetir size={14} />} onClick={() => jalankan(input)} disabled={proses}>
            {proses ? 'Menganalisis…' : 'Analisis'}
          </Tombol>
          {input && (
            <Tombol kecil nada="ghost" ikon={<IkonTutup size={13} />} onClick={() => setInput('')}>Bersihkan</Tombol>
          )}
          <span className="spacer" />
          <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>
            <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> untuk analisis
          </span>
        </div>
      </Kartu>

      {/* Contoh tugas */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 650, alignSelf: 'center' }}>Coba:</span>
        {CONTOH_TUGAS.map(c => (
          <button key={c.label} className="chip"
            onClick={() => { setInput(c.input); jalankan(c.input, c.tugas) }}
            style={{ cursor: 'pointer', fontSize: 11.5, padding: '5px 11px', fontWeight: 650 }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Proses */}
      {proses && (
        <Kartu style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2px solid var(--brand-200)', borderTopColor: 'var(--brand-600)',
              animation: 'spin 800ms linear infinite',
            }} />
            <span style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 600 }}>
              Mencocokkan fakta dengan redaksi, menghitung relevansi, dan menyiapkan kutipan…
            </span>
          </div>
        </Kartu>
      )}

      {/* Jawaban */}
      <div ref={refHasil}>
        {jawaban && !proses && <TampilanJawaban a={jawaban} q={input} onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} onBukaAnalisis={id => navigasi({ nama: 'analisis', id })} toast={tampilkanToast} />}
      </div>

      {/* Riwayat sesi */}
      {riwayat.length > 1 && (
        <>
          <div className="sek"><h2>Riwayat Sesi Ini</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riwayat.slice(1).map((r, i) => (
              <button key={i} className="card" onClick={() => setJawaban(r.a)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', textAlign: 'left' }}>
                <IkonAsisten size={13} style={{ color: 'var(--muted)', flex: 'none' }} />
                <span className="grow truncate" style={{ fontSize: 12.5, fontWeight: 550 }}>{r.q}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650, flex: 'none' }}>
                  {r.a.blok.length} blok
                </span>
                <IkonKanan size={13} style={{ color: 'var(--muted)', flex: 'none' }} />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Panduan Interaktif Tempus Delicti & Asas Lex Mitior */}
      <PanduanLexMitior onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />

      {/* Info penyedia */}
      <Kartu style={{ marginTop: 20, background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 8 }}>
          <IkonInfo size={14} style={{ color: 'var(--muted)' }} />
          <Label>Bagaimana asisten ini bekerja</Label>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.75 }}>
          <li>Semua perhitungan berjalan di perangkat Anda; tidak ada data yang dikirim ke server atau penyedia AI.</li>
          <li>Kutipan pasal diambil apa adanya dari dataset resmi, tanpa parafrase.</li>
          <li>Label unsur dihasilkan dari frasa yang benar-benar tertulis pada pasal, bukan rumusan yang dikarang.</li>
          <li>Bila tidak ada pasal yang cocok, asisten menyatakan "dasar tidak ditemukan" alih-alih menebak.</li>
          <li>Keluaran asisten adalah alat bantu penelusuran, bukan nasihat hukum atau pendapat hukum yang mengikat.</li>
        </ul>
      </Kartu>
    </div>
  )
}

function TampilanJawaban({
  a, q, onBukaPasal, onBukaAnalisis, toast,
}: {
  a: JawabanAI
  q: string
  onBukaPasal: (n: number) => void
  onBukaAnalisis: (id: string) => void
  toast: (m: string, j?: 'ok' | 'info' | 'galat') => void
}) {
  const simpanKeAnalisis = () => {
    const buatAnalisis = useStore.getState().buatAnalisis
    const ubahAnalisis = useStore.getState().ubahAnalisis
    const pasalSet = new Set<number>()
    for (const b of a.blok) {
      for (const n of b.pasal ?? []) pasalSet.add(n)
      for (const k of b.kutipan ?? []) pasalSet.add(k.pasal)
    }
    const id = buatAnalisis(a.judul || 'Analisis dari Asisten Hukum', q.trim())
    const ringkasan = a.blok.map(b => `[${b.judul}]\n${b.isi}`).join('\n\n')
    ubahAnalisis(id, {
      pasalTerkait: [...pasalSet].sort((x, y) => x - y),
      catatan: ringkasan,
    })
    toast('Disimpan ke Ruang Analisis')
    onBukaAnalisis(id)
  }
  const teksLengkap = () => {
    const baris: string[] = [`# ${a.judul}`, '']
    for (const b of a.blok) {
      baris.push(`## ${b.judul}`, b.isi, '')
      for (const k of b.kutipan ?? []) {
        baris.push(`> Pasal ${k.pasal}${k.ayat ? ` ayat (${k.ayat})` : ''}: ${k.teks}`, '')
      }
    }
    baris.push(`Sumber: UU No. 1 Tahun 2023 tentang KUHP · dihasilkan ${new Date().toLocaleString('id-ID')}`)
    return baris.join('\n')
  }

  return (
    <div className="anim-up" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.02em' }}>{a.judul}</h2>
        {a.dasarKosong && <Chip nada="warn" ikon={<IkonPeringatan size={10} />}>dasar tidak ditemukan</Chip>}
        <span className="spacer" />
        <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>{a.waktu} ms</span>
        <Tombol kecil nada="primary" ikon={<IkonTambah size={12} />} onClick={simpanKeAnalisis}>
          Jadikan Berkas Analisis
        </Tombol>
        <Tombol kecil nada="ghost" ikon={<IkonSalin size={12} />} onClick={async () => {
          const ok = await salin(teksLengkap())
          toast(ok ? 'Jawaban disalin' : 'Gagal menyalin', ok ? 'ok' : 'galat')
        }}>
          Salin
        </Tombol>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {a.blok.map((b, i) => {
          const w = WARNA_PERAN[b.peran]
          return (
            <Kartu key={i} pad={0} style={{ overflow: 'hidden', borderColor: b.peran === 'hukum' ? 'var(--ok)' : undefined }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px',
                background: w.bg, color: w.fg, borderBottom: '1px solid var(--border)',
              }}>
                {w.ikon}
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  {LABEL_PERAN[b.peran]}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, color: 'var(--text-soft)' }}>
                  {b.judul}
                </span>
              </div>

              <div style={{ padding: '11px 13px' }}>
                <div style={{
                  fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-soft)', whiteSpace: 'pre-wrap',
                  fontFamily: b.isi.includes('|') && b.isi.includes('---') ? 'var(--font-mono)' : undefined,
                  ...(b.isi.includes('|') && b.isi.includes('---') ? { fontSize: 11, overflowX: 'auto' } : {}),
                }}>
                  {b.isi}
                </div>

                {b.kutipan && b.kutipan.length > 0 && (
                  <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {b.kutipan.map((k, j) => (
                      <div key={j} style={{
                        borderLeft: '3px solid var(--ok)', paddingLeft: 10,
                        background: 'var(--surface-2)', padding: '7px 10px', borderRadius: '0 7px 7px 0',
                      }}>
                        <button onClick={() => onBukaPasal(k.pasal)}
                          style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--brand-700)', marginBottom: 3 }}>
                          Pasal {k.pasal}{k.ayat ? ` ayat (${k.ayat})` : ''} →
                        </button>
                        <div style={{ fontFamily: 'var(--font-doc)', fontSize: 12.5, lineHeight: 1.62, color: 'var(--text-soft)' }}>
                          {k.teks}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {b.pasal && b.pasal.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 9 }}>
                    {[...new Set(b.pasal)].slice(0, 18).map(n => (
                      <button key={n} onClick={() => onBukaPasal(n)}
                        className="mono" style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: 'var(--brand-50)', color: 'var(--brand-700)', cursor: 'pointer',
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Kartu>
          )
        })}
      </div>
    </div>
  )
}

function PanduanLexMitior({ onBukaPasal }: { onBukaPasal: (n: number) => void }) {
  const [tempus, setTempus] = useState<'sebelum' | 'sesudah'>('sebelum')
  const [statusPerkara, setStatusPerkara] = useState<'proses' | 'inkracht'>('proses')
  const [perubahan, setPerubahan] = useState<'untung_baru' | 'untung_lama' | 'hapus'>('untung_baru')

  const rekomendasi = () => {
    if (tempus === 'sesudah') {
      return {
        judul: 'Berlaku Penuh UU No. 1 Tahun 2023 (Asas Legalitas — Pasal 1 ayat (1))',
        uraian: 'Karena perbuatan (tempus delicti) dilakukan sejak atau setelah 2 Januari 2026 (3 tahun sejak diundangkan sesuai Pasal 624), maka ketentuan UU No. 1 Tahun 2023 berlaku sepenuhnya.',
        pasal: [1, 624],
      }
    }
    if (perubahan === 'hapus') {
      return {
        judul: 'Proses Dihentikan / Pidana Hapus demi Hukum (Pasal 3 ayat (2) & (3))',
        uraian: 'Apabila menurut UU baru perbuatan tersebut tidak lagi merupakan Tindak Pidana, maka proses hukum terhadap Tersangka/Terdakwa dihentikan demi hukum (Pasal 3 ayat (2)), dan jika sudah menjalani pidana maka pelaksanaan pidana dihapuskan (Pasal 3 ayat (3)).',
        pasal: [3, 618],
      }
    }
    if (statusPerkara === 'inkracht') {
      return {
        judul: 'Putusan Tetap (Inkracht) & Penyesuaian Pidana (Pasal 3)',
        uraian: 'Untuk putusan pemidanaan yang telah berkekuatan hukum tetap sebelum perubahan UU, pelaksanaan pidana tetap berjalan kecuali jika perbuatan tidak lagi merupakan tindak pidana (Pasal 3 ayat (3)).',
        pasal: [3, 618],
      }
    }
    if (perubahan === 'untung_baru') {
      return {
        judul: 'Diterapkan Ketentuan UU No. 1 Tahun 2023 (Asas Lex Mitior — Pasal 3 ayat (1) & Pasal 618)',
        uraian: 'Sesuai Pasal 3 ayat (1) dan Ketentuan Peralihan Pasal 618, terhadap perubahan peraturan sesudah perbuatan terjadi diberlakukan peraturan yang baru karena lebih menguntungkan bagi Tersangka/Terdakwa (baik dari segi ancaman pidana, sifat delik aduan, maupun alternatif pidana pengawasan/kerja sosial).',
        pasal: [3, 618],
      }
    }
    return {
      judul: 'Tetap Diterapkan Ketentuan Lama yang Lebih Menguntungkan (Pasal 3 ayat (1) in fine)',
      uraian: 'Berdasarkan pengecualian Pasal 3 ayat (1) ("kecuali ketentuan peraturan perundang-undangan yang lama lebih menguntungkan"), apabila rumusan atau ancaman pidana pada aturan lama (WvS) terbukti lebih ringan/menguntungkan bagi pelaku untuk tempus delicti sebelum masa berlaku UU 1/2023, maka digunakan ketentuan yang lama.',
      pasal: [3, 618],
    }
  }

  const hasil = rekomendasi()

  return (
    <Kartu style={{ marginTop: 20 }}>
      <div className="row-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        <IkonSkala size={15} style={{ color: 'var(--brand-700)' }} />
        <Label>Panduan Interaktif Tempus Delicti &amp; Asas Lex Mitior (Pasal 3 &amp; Pasal 618)</Label>
        <Chip nada="brand">Masa Transisi KUHP</Chip>
      </div>

      <div className="grid-3" style={{ gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 5 }}>1. Waktu Perbuatan (Tempus Delicti)</div>
          <select className="input" value={tempus} onChange={e => setTempus(e.target.value as 'sebelum' | 'sesudah')} style={{ minHeight: 36, fontSize: 12.5 }}>
            <option value="sebelum">Sebelum 2 Januari 2026 (Masa WvS)</option>
            <option value="sesudah">Sejak / Setelah 2 Januari 2026</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 5 }}>2. Status Perkara Saat Ini</div>
          <select className="input" value={statusPerkara} onChange={e => setStatusPerkara(e.target.value as 'proses' | 'inkracht')} disabled={tempus === 'sesudah'} style={{ minHeight: 36, fontSize: 12.5 }}>
            <option value="proses">Sedang Penyidikan / Penuntutan / Sidang</option>
            <option value="inkracht">Sudah Putusan Tetap (Inkracht)</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 5 }}>3. Perbandingan Aturan</div>
          <select className="input" value={perubahan} onChange={e => setPerubahan(e.target.value as 'untung_baru' | 'untung_lama' | 'hapus')} disabled={tempus === 'sesudah'} style={{ minHeight: 36, fontSize: 12.5 }}>
            <option value="untung_baru">UU 1/2023 lebih menguntungkan</option>
            <option value="untung_lama">KUHP Lama (WvS) lebih menguntungkan</option>
            <option value="hapus">Bukan lagi tindak pidana di UU 1/2023</option>
          </select>
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-700)', marginBottom: 4 }}>{hasil.judul}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 8 }}>{hasil.uraian}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {hasil.pasal.map(n => (
            <Tombol key={n} kecil onClick={() => onBukaPasal(n)}>Buka Pasal {n}</Tombol>
          ))}
        </div>
      </div>
    </Kartu>
  )
}
