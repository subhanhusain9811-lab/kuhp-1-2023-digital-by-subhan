/* ============================================================
   LAMPIRAN I — DAFTAR PERUBAHAN KETENTUAN PIDANA DI LUAR KUHP
   186 undang-undang · 1.558 baris ketentuan.

   Data ini hasil PEMBACAAN SILANG dua sumber OCR independen:
   (1) PDF salinan resmi UU 1/2026 (OCR tertanam)
   (2) basis data platform hukum digital pihak ketiga

   Karena keduanya OCR, setiap baris ditandai menurut tingkat
   keterverifikasiannya. Tidak ada yang disembunyikan.
   ============================================================ */
import { useMemo, useState } from 'react'
import { Kartu, Label } from '@/components/ui'
import data from '@/data/lampiran1-terSilang.json'

type Baris = { pasalAyat: string; ancaman: string; halaman: number; terkonfirmasi: boolean }
type Status = 'TERVERIFIKASI' | 'DIPULIHKAN' | 'DARI_PEMBANDING' | 'KONFLIK' | 'TIDAK_ADA'
type Entri = {
  nomor: number
  undangUndang: string
  undangUndangAsli: string
  nomorTahun: number[] | null
  status: Status
  buktiPdf: number[][]
  nomorTahunPembanding: number[] | null
  diverifikasiManusia?: boolean
  catatan: string[]
  halaman: number[]
  ketentuan: Baris[]
  jumlahKetentuan: number
  ketentuanTerkonfirmasi: number
}
const daftar = data.daftar as Entri[]
const meta = data.meta

const PERLU_DILIHAT: Status[] = ['KONFLIK', 'TIDAK_ADA', 'DARI_PEMBANDING']

const WARNA: Record<Status, { bg: string; fg: string; teks: string }> = {
  TERVERIFIKASI:   { bg: '#d1fae5', fg: '#065f46', teks: 'Terverifikasi 2 sumber' },
  DIPULIHKAN:      { bg: '#dbeafe', fg: '#1e40af', teks: 'Dipulihkan dari PDF' },
  DARI_PEMBANDING: { bg: '#ede9fe', fg: '#5b21b6', teks: 'Dari pembanding saja' },
  KONFLIK:         { bg: '#fef3c7', fg: '#92400e', teks: 'Perlu diperiksa' },
  TIDAK_ADA:       { bg: '#fee2e2', fg: '#991b1b', teks: 'Nomor tak terbaca' },
}

export function LampiranI() {
  const [kueri, setKueri] = useState('')
  const [saring, setSaring] = useState<'semua' | 'TERVERIFIKASI' | 'PERLU'>('semua')
  const [batas, setBatas] = useState(25)
  const [buka, setBuka] = useState<number | null>(null)

  const hasil = useMemo(() => {
    const q = kueri.trim().toLowerCase()
    return daftar.filter(e => {
      if (saring === 'TERVERIFIKASI' && e.status !== 'TERVERIFIKASI') return false
      if (saring === 'PERLU' && !PERLU_DILIHAT.includes(e.status)) return false
      if (!q) return true
      if (e.undangUndang.toLowerCase().includes(q)) return true
      if (String(e.nomor) === q) return true
      return e.ketentuan.some(k =>
        k.pasalAyat.toLowerCase().includes(q) || k.ancaman.toLowerCase().includes(q))
    })
  }, [kueri, saring])

  const tampil = hasil.slice(0, batas)

  return (
    <div>
      {/* ---------- Kepala ---------- */}
      <Kartu style={{ background: 'var(--surface-2)', marginBottom: 12 }}>
        <div className="row-gap" style={{ marginBottom: 8 }}>
          <Label>Lampiran I — Perubahan Ketentuan Pidana di Luar KUHP</Label>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: '0 0 10px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>{meta.jumlahUU} undang-undang</strong> ·{' '}
          <strong style={{ color: 'var(--text)' }}>{meta.jumlahBaris.toLocaleString('id-ID')} baris ketentuan</strong> ·
          halaman 72–229 naskah asli.
        </p>
        <div style={{
          fontSize: 11.5, lineHeight: 1.6, padding: '9px 11px', borderRadius: 8,
          background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
        }}>
          <strong>Perlu diketahui:</strong> daftar ini disusun dengan membaca silang dua sumber OCR
          independen — PDF salinan resmi dan basis data pihak ketiga. Keduanya hasil pindaian,
          jadi setiap baris tetap <strong>wajib dicocokkan ke PDF cetak</strong> sebelum dipakai
          sebagai rujukan resmi. Kolom halaman disediakan untuk itu.
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 11.5 }}>
          <span><strong style={{ color: '#065f46' }}>{meta.nomorTerverifikasi}</strong> nomor terverifikasi</span>
          <span>
            <strong style={{ color: '#065f46' }}>{meta.nomorDiverifikasiManusia}</strong>
            {' '}di antaranya dibaca langsung dari PDF
          </span>
          <span><strong style={{ color: '#92400e' }}>{meta.nomorPerluDiperiksa}</strong> perlu dicek</span>
          <span>
            <strong style={{ color: 'var(--text)' }}>{meta.barisTerkonfirmasi.toLocaleString('id-ID')}</strong>
            {' '}dari {meta.jumlahBaris.toLocaleString('id-ID')} baris teks cocok ({' '}
            {Math.round((meta.barisTerkonfirmasi / meta.jumlahBaris) * 100)}% )
          </span>
        </div>
      </Kartu>

      {/* ---------- Pencarian & saringan ---------- */}
      <input
        value={kueri}
        onChange={e => { setKueri(e.target.value); setBatas(25) }}
        placeholder="Cari nama UU, nomor, atau pasal…"
        aria-label="Cari di Lampiran I"
        style={{
          width: '100%', padding: '11px 13px', fontSize: 14, borderRadius: 9,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text)', marginBottom: 9,
        }}
      />
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
        {([
          ['semua', 'Semua 186'],
          ['TERVERIFIKASI', 'Nomor terverifikasi'],
          ['PERLU', 'Perlu diperiksa'],
        ] as const).map(([id, teks]) => (
          <button
            key={id}
            onClick={() => { setSaring(id); setBatas(25) }}
            aria-pressed={saring === id}
            style={{
              padding: '7px 12px', fontSize: 12, fontWeight: 600, borderRadius: 999,
              cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid ' + (saring === id ? 'var(--brand-600,#1d4ed8)' : 'var(--border)'),
              background: saring === id ? 'var(--brand-600,#1d4ed8)' : 'transparent',
              color: saring === id ? '#fff' : 'var(--muted)',
            }}
          >
            {teks}
          </button>
        ))}
      </div>

      {hasil.length === 0 && (
        <Kartu>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)' }}>
            Tidak ada yang cocok dengan “{kueri}”.
          </p>
          {/narkotika|psikotropika|prekursor/i.test(kueri) && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: '#92400e',
                        background: '#fef3c7', padding: '9px 11px', borderRadius: 8 }}>
              Narkotika tidak ada di Lampiran I — perubahannya diatur tersendiri dalam{' '}
              <strong>Lampiran II</strong>. Coba buka tab “Lampiran II · Narkotika”.
            </p>
          )}
        </Kartu>
      )}

      {/* ---------- Daftar ---------- */}
      {tampil.map(e => {
        const w = WARNA[e.status]
        const terbuka = buka === e.nomor
        return (
          <Kartu key={e.nomor} style={{ marginBottom: 9, padding: '12px 13px' }}>
            <button
              onClick={() => setBuka(terbuka ? null : e.nomor)}
              aria-expanded={terbuka}
              style={{
                display: 'flex', gap: 10, width: '100%', alignItems: 'flex-start',
                background: 'none', border: 0, padding: 0, cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
              }}
            >
              <span style={{
                flexShrink: 0, minWidth: 30, fontWeight: 700, fontSize: 12.5,
                color: 'var(--muted)', paddingTop: 2,
              }}>
                {e.nomor}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {e.nomorTahun && (
                  <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.5, fontWeight: 700 }}>
                    UU No. {e.nomorTahun[0]} Tahun {e.nomorTahun[1]}
                  </span>
                )}
                <span style={{
                  display: 'block', fontSize: e.nomorTahun ? 12 : 13.5, lineHeight: 1.5,
                  fontWeight: e.nomorTahun ? 400 : 600,
                  color: e.nomorTahun ? 'var(--muted)' : 'inherit',
                }}>
                  {e.undangUndang || <em>(nama tidak terbaca)</em>}
                </span>
                <span style={{
                  display: 'inline-block', marginTop: 5, fontSize: 10.5, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 5, background: w.bg, color: w.fg,
                }}>
                  {w.teks}
                </span>
                {e.diverifikasiManusia && (
                  <span style={{
                    display: 'inline-block', marginTop: 5, marginLeft: 6, fontSize: 10.5,
                    fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: '#065f46', color: '#fff',
                  }}>
                    ✓ dibaca manusia
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                  {e.jumlahKetentuan} baris · hlm. {e.halaman.join(', ')}
                </span>
              </span>
              <span style={{ flexShrink: 0, color: 'var(--muted)', fontSize: 12, paddingTop: 2 }}>
                {terbuka ? '▲' : '▼'}
              </span>
            </button>

            {terbuka && (
              <div style={{ marginTop: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                {e.catatan.length > 0 && (
                  <p style={{ fontSize: 11, color: '#92400e', margin: '0 0 8px' }}>
                    Catatan penyuntingan: {e.catatan.join('; ')}.
                  </p>
                )}

                {/* ---- perbandingan bukti kedua sumber ---- */}
                <div style={{
                  fontSize: 11.5, lineHeight: 1.6, margin: '0 0 10px', padding: '8px 10px',
                  borderRadius: 7, background: 'var(--surface-2)',
                }}>
                  <div>
                    <strong>Pembanding:</strong>{' '}
                    {e.nomorTahunPembanding
                      ? `${e.nomorTahunPembanding[0]} Tahun ${e.nomorTahunPembanding[1]}`
                      : <em style={{ color: 'var(--muted)' }}>tidak menyebut nomor</em>}
                  </div>
                  <div>
                    <strong>PDF (jangkar):</strong>{' '}
                    {e.buktiPdf.length > 0
                      ? e.buktiPdf.map(b => `${b[0]} Tahun ${b[1]}`).join(' · ')
                      : <em style={{ color: 'var(--muted)' }}>tidak terbaca</em>}
                  </div>
                  {e.status === 'KONFLIK' && (
                    <div style={{ marginTop: 5, color: '#92400e' }}>
                      Kedua sumber berbeda. Ikuti kolom <strong>Undang-Undang</strong> pada
                      halaman {e.halaman.join(', ')} PDF cetak.
                    </div>
                  )}
                </div>
                {e.ketentuan.map((k, i) => (
                  <div key={i} style={{
                    fontSize: 12, lineHeight: 1.6, marginBottom: 9,
                    paddingLeft: 9, borderLeft: '2px solid ' + (k.terkonfirmasi ? '#a7f3d0' : '#fcd34d'),
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {k.pasalAyat ? `Pasal ${k.pasalAyat}` : <em style={{ color: 'var(--muted)' }}>(lanjutan)</em>}
                      <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 10.5, marginLeft: 7 }}>
                        hlm. {k.halaman}{k.terkonfirmasi ? ' · ✓ cocok' : ' · perlu cek'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--muted)' }}>{k.ancaman}</div>
                  </div>
                ))}
              </div>
            )}
          </Kartu>
        )
      })}

      {/* ---------- Muat lagi ---------- */}
      {hasil.length > batas && (
        <button
          onClick={() => setBatas(b => b + 25)}
          style={{
            width: '100%', padding: '12px', fontSize: 13, fontWeight: 600,
            borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
          }}
        >
          Muat 25 lagi — menampilkan {tampil.length} dari {hasil.length}
        </button>
      )}

      <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, marginTop: 14 }}>
        <strong>Metode.</strong> {meta.metode} Nomor dan tahun undang-undang dicocokkan ke baris
        tabel pada halaman PDF yang sama, dengan toleransi terhadap galat lazim OCR
        (huruf O dibaca nol, huruf l dibaca satu). Teks ancaman pidana dicocokkan 35 huruf
        pertama ke seluruh teks Lampiran I.
      </p>
    </div>
  )
}
