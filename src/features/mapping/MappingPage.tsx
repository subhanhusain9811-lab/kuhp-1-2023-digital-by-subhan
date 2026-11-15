/* ============================================================
   Pemetaan Hukum
   Pengelompokan menurut nomenklatur bab resmi + saringan turunan
   yang HANYA memakai penanda yang benar-benar ada di redaksi.
   ============================================================ */
import { useMemo, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { klasifikasi, faktorPidana, TOPIK, type Topik } from './relasi'
import { htmlKeTeks } from '@/lib/format'
import { Kartu, Chip, Tombol, Kosong, Label, Segmen } from '@/components/ui'
import {
  IkonPemetaan, IkonSaring, IkonKanan, IkonPalu, IkonTopik,
  IkonTarget, IkonPerisai, IkonFilterX, IkonCari,
} from '@/components/Ikon'
import type { Pasal } from '@/lib/types'

type Modus = 'topik' | 'unsur' | 'ancaman' | 'subjek' | 'faktor'

const FILTER_UNSUR = [
  { id: 'sengaja', label: 'Kesengajaan', tipe: 'subjektif' },
  { id: 'maksud', label: 'Maksud / niat', tipe: 'subjektif' },
  { id: 'rencana', label: 'Rencana terlebih dahulu', tipe: 'subjektif' },
  { id: 'kealpaan', label: 'Kealpaan', tipe: 'subjektif' },
  { id: 'mengetahui', label: 'Mengetahui', tipe: 'subjektif' },
  { id: 'mengambil', label: 'Mengambil', tipe: 'objektif' },
  { id: 'merampas', label: 'Merampas', tipe: 'objektif' },
  { id: 'memalsu', label: 'Memalsu', tipe: 'objektif' },
  { id: 'kekerasan', label: 'Kekerasan', tipe: 'objektif' },
  { id: 'memaksa', label: 'Memaksa', tipe: 'objektif' },
  { id: 'menyesatkan', label: 'Menyesatkan/menipu', tipe: 'objektif' },
  { id: 'melawan-hukum', label: 'Melawan hukum', tipe: 'objektif' },
  { id: 'barang', label: 'Objek barang', tipe: 'objektif' },
  { id: 'nyawa', label: 'Objek nyawa', tipe: 'objektif' },
] as const

const FILTER_ANCAMAN = [
  { id: 'mati', label: 'Pidana mati' },
  { id: 'seumurHidup', label: 'Penjara seumur hidup' },
  { id: 'penjara', label: 'Pidana penjara' },
  { id: 'denda', label: 'Pidana denda' },
  { id: 'pengawasan', label: 'Pidana pengawasan' },
  { id: 'kerjaSosial', label: 'Kerja sosial' },
  { id: 'tutupan', label: 'Pidana tutupan' },
  { id: 'pencabutanHak', label: 'Pencabutan hak' },
  { id: 'perampasan', label: 'Perampasan barang' },
]

const FILTER_SUBJEK = ['Setiap Orang', 'Pejabat', 'Korporasi', 'Nakhoda', 'Ibu', 'Anak', 'Pengurus / komisaris']

export function MappingPage() {
  const navigasi = useStore(s => s.navigasi)
  const [modus, setModus] = useState<Modus>('topik')
  const [topikId, setTopikId] = useState<string | null>(null)
  const [unsurId, setUnsurId] = useState<string | null>(null)
  const [ancamanId, setAncamanId] = useState<string | null>(null)
  const [subjekId, setSubjekId] = useState<string | null>(null)
  const [faktorId, setFaktorId] = useState<string | null>(null)
  const [q, setQ] = useState('')

  // indeks klasifikasi dihitung sekali
  const indeks = useMemo(() => {
    const m = new Map<number, ReturnType<typeof klasifikasi>>()
    for (const p of db.pasal) m.set(p.nomor, klasifikasi(p))
    return m
  }, [])

  const hasil: Pasal[] = useMemo(() => {
    let arr: Pasal[] = []

    if (modus === 'topik') {
      const t = TOPIK.find(x => x.id === topikId)
      arr = t ? t.pasal.map(n => db.get(n)!).filter(Boolean) : []
    } else if (modus === 'unsur' && unsurId) {
      const f = FILTER_UNSUR.find(x => x.id === unsurId)!
      arr = db.pasal.filter(p => {
        const k = indeks.get(p.nomor)!
        const daftar = f.tipe === 'subjektif' ? k.subjektif : k.objektif
        return daftar.some(d => d.toLowerCase().includes(f.label.toLowerCase().split(' ')[0]))
      })
    } else if (modus === 'ancaman' && ancamanId) {
      arr = db.pasal.filter(p => {
        const a = p.ancaman
        if (ancamanId === 'mati') return a.mati
        if (ancamanId === 'seumurHidup') return a.seumurHidup
        if (ancamanId === 'penjara') return (a.penjara?.length ?? 0) > 0
        if (ancamanId === 'denda') return (a.denda?.length ?? 0) > 0
        if (ancamanId === 'pengawasan') return a.pengawasan
        if (ancamanId === 'kerjaSosial') return a.kerjaSosial
        if (ancamanId === 'tutupan') return a.tutupan
        if (ancamanId === 'pencabutanHak') return a.pencabutanHak
        if (ancamanId === 'perampasan') return a.perampasan
        return false
      })
    } else if (modus === 'subjek' && subjekId) {
      arr = db.pasal.filter(p => indeks.get(p.nomor)!.subjek.includes(subjekId))
    } else if (modus === 'faktor' && faktorId) {
      arr = db.pasal.filter(p => {
        const f = faktorPidana(p)
        return faktorId === 'berat'
          ? f.memberatkan.length > 0
          : f.meringankan.length > 0
      })
    }

    const t = q.trim().toLowerCase()
    if (t) {
      arr = arr.filter(p =>
        String(p.nomor).includes(t) ||
        p.babJudul.toLowerCase().includes(t) ||
        htmlKeTeks(p.teks).toLowerCase().includes(t)
      )
    }
    return arr
  }, [modus, topikId, unsurId, ancamanId, subjekId, faktorId, q, indeks])

  const reset = () => {
    setTopikId(null); setUnsurId(null); setAncamanId(null)
    setSubjekId(null); setFaktorId(null); setQ('')
  }

  const adaFilter = topikId || unsurId || ancamanId || subjekId || faktorId

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 4 }}>
          Pemetaan Hukum
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 720 }}>
          Pasal dikelompokkan menurut nomenklatur bab resmi KUHP. Saringan unsur, subjek, dan ancaman
          hanya mendeteksi penanda yang tertulis dalam redaksi — tidak ada unsur atau pidana yang ditambahkan.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Segmen<Modus>
          nilai={modus} label="Modus pemetaan"
          opsi={[
            { nilai: 'topik', label: 'Topik Resmi' },
            { nilai: 'unsur', label: 'Unsur' },
            { nilai: 'ancaman', label: 'Ancaman' },
            { nilai: 'subjek', label: 'Subjek Hukum' },
            { nilai: 'faktor', label: 'Pemberat/Peringan' },
          ]}
          onUbah={m => { setModus(m); reset() }}
        />
        {adaFilter && (
          <Tombol kecil ikon={<IkonFilterX size={13} />} onClick={reset}>Reset saringan</Tombol>
        )}
      </div>

      {/* ===== Panel pilihan ===== */}
      {modus === 'topik' && (
        <div className="grid-2" style={{ marginBottom: 18 }}>
          {TOPIK.map(t => (
            <button
              key={t.id}
              className="card"
              onClick={() => setTopikId(topikId === t.id ? null : t.id)}
              style={{
                textAlign: 'left', padding: 13,
                borderColor: topikId === t.id ? 'var(--brand-400)' : undefined,
                background: topikId === t.id ? 'var(--brand-50)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <IkonTopik size={14} style={{ color: topikId === t.id ? 'var(--brand-700)' : 'var(--muted)' }} />
                <span style={{ fontWeight: 750, fontSize: 13.5 }}>{t.nama}</span>
                <span className="spacer" />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)' }}>
                  {t.pasal.length} pasal
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>{t.keterangan}</div>
            </button>
          ))}
        </div>
      )}

      {modus === 'unsur' && (
        <Kartu style={{ marginBottom: 18 }}>
          <div className="row-gap" style={{ marginBottom: 9 }}>
            <Label>Unsur Subjektif</Label>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>— sikap batin pelaku</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {FILTER_UNSUR.filter(f => f.tipe === 'subjektif').map(f => (
              <button key={f.id} className="chip"
                onClick={() => setUnsurId(unsurId === f.id ? null : f.id)}
                style={{
                  cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650,
                  background: unsurId === f.id ? 'var(--brand-500)' : undefined,
                  color: unsurId === f.id ? '#fff' : undefined,
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="row-gap" style={{ marginBottom: 9 }}>
            <Label>Unsur Objektif</Label>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>— perbuatan & objek</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FILTER_UNSUR.filter(f => f.tipe === 'objektif').map(f => (
              <button key={f.id} className="chip"
                onClick={() => setUnsurId(unsurId === f.id ? null : f.id)}
                style={{
                  cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650,
                  background: unsurId === f.id ? 'var(--brand-500)' : undefined,
                  color: unsurId === f.id ? '#fff' : undefined,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </Kartu>
      )}

      {modus === 'ancaman' && (
        <Kartu style={{ marginBottom: 18 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonPalu size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Jenis Ancaman Pidana</Label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FILTER_ANCAMAN.map(f => (
              <button key={f.id} className="chip"
                onClick={() => setAncamanId(ancamanId === f.id ? null : f.id)}
                style={{
                  cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650,
                  background: ancamanId === f.id ? 'var(--brand-500)' : undefined,
                  color: ancamanId === f.id ? '#fff' : undefined,
                }}>
                {f.label}
                <span style={{ opacity: .7, fontWeight: 600 }}>
                  {f.id === 'mati' ? db.pasal.filter(p => p.ancaman.mati).length
                    : f.id === 'seumurHidup' ? db.pasal.filter(p => p.ancaman.seumurHidup).length
                      : f.id === 'penjara' ? db.pasal.filter(p => (p.ancaman.penjara?.length ?? 0) > 0).length
                        : f.id === 'denda' ? db.pasal.filter(p => (p.ancaman.denda?.length ?? 0) > 0).length
                          : db.pasal.filter(p => (p.ancaman as unknown as Record<string, boolean>)[f.id]).length}
                </span>
              </button>
            ))}
          </div>
        </Kartu>
      )}

      {modus === 'subjek' && (
        <Kartu style={{ marginBottom: 18 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonTarget size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Subjek Hukum yang Disebut Redaksi</Label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FILTER_SUBJEK.map(s => (
              <button key={s} className="chip"
                onClick={() => setSubjekId(subjekId === s ? null : s)}
                style={{
                  cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650,
                  background: subjekId === s ? 'var(--brand-500)' : undefined,
                  color: subjekId === s ? '#fff' : undefined,
                }}>
                {s}
              </button>
            ))}
          </div>
        </Kartu>
      )}

      {modus === 'faktor' && (
        <Kartu style={{ marginBottom: 18 }}>
          <div className="row-gap" style={{ marginBottom: 10 }}>
            <IkonPemetaan size={15} style={{ color: 'var(--brand-700)' }} />
            <Label>Keadaan Pemberat & Peringan</Label>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="chip" onClick={() => setFaktorId(faktorId === 'berat' ? null : 'berat')}
              style={{
                cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650,
                background: faktorId === 'berat' ? 'var(--warn)' : undefined,
                color: faktorId === 'berat' ? '#fff' : undefined,
              }}>
              Keadaan memberatkan
            </button>
            <button className="chip" onClick={() => setFaktorId(faktorId === 'ringan' ? null : 'ringan')}
              style={{
                cursor: 'pointer', fontSize: 12, padding: '6px 12px', fontWeight: 650,
                background: faktorId === 'ringan' ? 'var(--ok)' : undefined,
                color: faktorId === 'ringan' ? '#fff' : undefined,
              }}>
              Keadaan meringankan
            </button>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>
            Keadaan di atas dideteksi dari frasa eksplisit dalam redaksi atau penjelasan pasal.
          </p>
        </Kartu>
      )}

      {/* ===== Hasil ===== */}
      {!adaFilter && modus === 'topik' && (
        <Kartu>
          <Kosong
            ikon={<IkonPemetaan size={24} />}
            judul="Pilih salah satu topik"
            pesan="Setiap topik mengikuti nomenklatur bab resmi KUHP, sehingga pengelompokan dapat ditelusuri ke struktur undang-undang."
          />
        </Kartu>
      )}

      {adaFilter && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap',
            marginBottom: 11, paddingBottom: 9, borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 750 }}>{hasil.length} pasal</div>
            <div className="topbar-cari" style={{ flex: 1, minWidth: 160, maxWidth: 280 }}>
              <IkonCari size={14} className="ikon-cari" />
              <input className="input" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Saring hasil…" aria-label="Saring hasil pemetaan"
                style={{ minHeight: 32, fontSize: 12.5, paddingLeft: 31 }} />
            </div>
          </div>

          {hasil.length === 0 ? (
            <Kartu>
              <Kosong ikon={<IkonSaring size={24} />} judul="Tidak ada pasal yang cocok"
                pesan="Kombinasi saringan ini tidak menghasilkan pasal. Coba longgarkan saringan." />
            </Kartu>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {hasil.slice(0, 150).map(p => {
                const k = indeks.get(p.nomor)!
                return (
                  <div key={p.nomor} className="card" style={{ padding: '11px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <button onClick={() => navigasi({ nama: 'baca', pasal: p.nomor })}
                        style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-700)' }}>
                        Pasal {p.nomor}
                      </button>
                      <Chip>Bab {p.bab}</Chip>
                      <span className="grow truncate" style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 650 }}>
                        {p.babJudul}
                      </span>
                      <IkonKanan size={13} style={{ color: 'var(--muted)', flex: 'none' }} />
                    </div>

                    <p style={{
                      fontFamily: 'var(--font-doc)', fontSize: 12.5, lineHeight: 1.55,
                      color: 'var(--text-soft)', margin: '4px 0 7px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {htmlKeTeks(p.teks)}
                    </p>

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {k.subjektif.slice(0, 2).map(u => (
                        <Chip key={u} nada="brand" judul="Unsur subjektif terdeteksi">{u}</Chip>
                      ))}
                      {k.objektif.slice(0, 2).map(u => (
                        <Chip key={u} judul="Unsur objektif terdeteksi">{u}</Chip>
                      ))}
                      {k.ancaman.slice(0, 2).map(u => (
                        <Chip key={u} nada="ok" judul="Ancaman dari redaksi">{u}</Chip>
                      ))}
                    </div>
                  </div>
                )
              })}
              {hasil.length > 150 && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', padding: 12 }}>
                  Menampilkan 150 dari {hasil.length} pasal. Persempit saringan untuk melihat lebih sedikit hasil.
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Kartu style={{ marginTop: 22, background: 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 7 }}>
          <IkonPerisai size={14} style={{ color: 'var(--muted)' }} />
          <Label>Metode</Label>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>
          Klasifikasi dilakukan dengan mencocokkan frasa penanda pada redaksi pasal dan penjelasannya
          (mis. "dengan maksud", "mengambil", "karena kealpaan"). Bila suatu pasal tidak memuat penanda,
          pasal tersebut tidak dimasukkan ke kategori terkait. Ringkasan ancaman dibaca dari ketentuan
          pidana yang tercantum pada pasal itu sendiri, dengan kategori denda mengacu pada Pasal 79.
        </p>
      </Kartu>
    </div>
  )
}

export type { Topik }
