/* ============================================================
   Asisten Hukum — antarmuka penyedia lokal
   ============================================================ */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { penyediaLokal, LABEL_PERAN, CONTOH_TUGAS, deteksiTugas, type JawabanAI, type Blok } from './provider'
import { Kartu, Chip, Tombol, Label } from '@/components/ui'
import {
  IkonAsisten, IkonPetir, IkonPerisai, IkonInfo, IkonPeringatan,
  IkonKanan, IkonSalin, IkonTarget, IkonTutup,
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
        {jawaban && !proses && <TampilanJawaban a={jawaban} onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} toast={tampilkanToast} />}
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
  a, onBukaPasal, toast,
}: { a: JawabanAI; onBukaPasal: (n: number) => void; toast: (m: string, j?: 'ok' | 'info' | 'galat') => void }) {
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
