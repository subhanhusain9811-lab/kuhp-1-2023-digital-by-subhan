/* ============================================================
   Pemetaan Hukum
   Pengelompokan menurut nomenklatur bab resmi + saringan turunan
   yang HANYA memakai penanda yang benar-benar ada di redaksi.
   ============================================================ */
import { useMemo, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { klasifikasi, faktorPidana, TOPIK, type Topik } from './relasi'
import { htmlKeTeks, DENDA_KATEGORI, rupiah, angkaId, ringkasAncaman } from '@/lib/format'
import { Kartu, Chip, Tombol, Kosong, Label, Segmen } from '@/components/ui'
import {
  IkonPemetaan, IkonSaring, IkonKanan, IkonPalu, IkonTopik,
  IkonTarget, IkonPerisai, IkonFilterX, IkonCari,
} from '@/components/Ikon'
import type { Pasal } from '@/lib/types'

type Modus = 'topik' | 'unsur' | 'ancaman' | 'subjek' | 'faktor' | 'konversi' | 'kalkulator'

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

const KONVERSI_WVS: {
  wvs: string
  delik: string
  baru: number
  catatan: string
}[] = [
  { wvs: 'Pasal 1 ayat (1)', delik: 'Asas Legalitas', baru: 1, catatan: 'Diperluas dengan pengakuan hukum yang hidup dalam masyarakat (Pasal 2)' },
  { wvs: 'Pasal 1 ayat (2)', delik: 'Aturan Peralihan / Lex Mitior', baru: 3, catatan: 'Diterapkan ketentuan yang paling menguntungkan bagi terdakwa/tersangka' },
  { wvs: 'Pasal 55', delik: 'Penyertaan / Turut Serta (Deelneming)', baru: 20, catatan: 'Pelaku, menyuruh melakukan, turut serta, dan penganjur' },
  { wvs: 'Pasal 56', delik: 'Pembantuan Tindak Pidana (Medeplichtigheid)', baru: 21, catatan: 'Pidana pembantu dikurangi 1/3 dari ancaman pidana pokok' },
  { wvs: 'Pasal 63', delik: 'Perbarengan Peraturan (Concursus Idealis)', baru: 125, catatan: 'Dijatuhi 1 pidana pokok yang paling berat; lex specialis berlaku' },
  { wvs: 'Pasal 64', delik: 'Perbuatan Berlanjut (Voorgezette Handeling)', baru: 126, catatan: 'Beberapa tindak pidana berlanjut dijatuhi 1 pidana pokok terberat' },
  { wvs: 'Pasal 65', delik: 'Perbarengan Perbuatan (Concursus Realis)', baru: 127, catatan: 'Akumulasi terbatas: maksimum pidana terberat ditambah 1/3' },
  { wvs: 'Pasal 78', delik: 'Gugurnya Penuntutan karena Daluwarsa', baru: 136, catatan: 'Tenggang waktu 3, 6, 12, 18, atau 20 tahun sesuai ancaman pidana' },
  { wvs: 'Pasal 156a', delik: 'Tindak Pidana terhadap Agama / Kepercayaan', baru: 300, catatan: 'Permusuhan, kebencian, atau penghasutan terhadap agama/kepercayaan' },
  { wvs: 'Pasal 170', delik: 'Kekerasan Bersama-sama di Muka Umum (Pengeroyokan)', baru: 262, catatan: 'Dengan tenaga bersama melakukan kekerasan terhadap orang atau barang' },
  { wvs: 'Pasal 242', delik: 'Keterangan Palsu di Atas Sumpah', baru: 291, catatan: 'Memberikan keterangan palsu di atas sumpah dalam proses peradilan' },
  { wvs: 'Pasal 263', delik: 'Pemalsuan Surat Biasa', baru: 391, catatan: 'Membuat secara tidak benar atau memalsu surat yang menimbulkan hak/perikatan' },
  { wvs: 'Pasal 264', delik: 'Pemalsuan Akta Autentik / Surat Berharga', baru: 392, catatan: 'Pemalsuan terhadap akta autentik, surat utang, atau sertifikat' },
  { wvs: 'Pasal 266', delik: 'Menyuruh Memasukkan Keterangan Palsu ke Akta Autentik', baru: 394, catatan: 'Meminta dimasukkan keterangan palsu ke dalam akta autentik' },
  { wvs: 'Pasal 284', delik: 'Perzinaan (Overspel)', baru: 411, catatan: 'Delik aduan absolut (suami/istri, atau orang tua/anak bagi yang tidak terikat perkawinan)' },
  { wvs: 'Pasal 285', delik: 'Perkosaan', baru: 473, catatan: 'Diatur dalam Bab Tindak Pidana terhadap Tubuh dengan perluasan cakupan' },
  { wvs: 'Pasal 310', delik: 'Penyerangan Kehormatan / Pencemaran Nama Baik', baru: 433, catatan: 'Menuduhkan suatu hal dengan lisan atau tulisan agar diketahui umum' },
  { wvs: 'Pasal 311', delik: 'Fitnah (Laster)', baru: 434, catatan: 'Tidak dapat membuktikan kebenaran tuduhan yang bertentangan dengan yang diketahui' },
  { wvs: 'Pasal 315', delik: 'Penghinaan Ringan (Lichte Belediging)', baru: 436, catatan: 'Penghinaan yang tidak bersifat pencemaran lisan/tertulis' },
  { wvs: 'Pasal 335', delik: 'Pemaksaan Secara Melawan Hukum', baru: 448, catatan: 'Memaksa orang lain melakukan/tidak melakukan sesuatu dengan kekerasan/ancaman' },
  { wvs: 'Pasal 338', delik: 'Pembunuhan Biasa (Doodslag)', baru: 458, catatan: 'Merampas nyawa orang lain, ancaman penjara paling lama 15 tahun' },
  { wvs: 'Pasal 340', delik: 'Pembunuhan Berencana (Moord)', baru: 459, catatan: 'Dengan rencana terlebih dahulu merampas nyawa orang lain' },
  { wvs: 'Pasal 351', delik: 'Penganiayaan (Mishandeling)', baru: 466, catatan: 'Penganiayaan umum, luka berat, atau mengakibatkan mati' },
  { wvs: 'Pasal 354', delik: 'Penganiayaan Berat (Zware Mishandeling)', baru: 468, catatan: 'Melukai berat orang lain dengan sengaja' },
  { wvs: 'Pasal 359 / 360', delik: 'Kealpaan Mengakibatkan Mati atau Luka (Culpa)', baru: 474, catatan: 'Pemberatan +1/3 diatur pada Pasal 475 (padanan Pasal 361 WvS) jika dalam jabatan/profesi' },
  { wvs: 'Pasal 362', delik: 'Pencurian Biasa (Diefstal)', baru: 476, catatan: 'Mengambil barang milik orang lain dengan maksud dimiliki secara melawan hukum' },
  { wvs: 'Pasal 363', delik: 'Pencurian dengan Pemberatan (Curat)', baru: 477, catatan: 'Malam hari, bencana, bersama-sama, atau merusak/membongkar' },
  { wvs: 'Pasal 365', delik: 'Pencurian dengan Kekerasan (Curas)', baru: 479, catatan: 'Didahului, disertai, atau diikuti kekerasan/ancaman kekerasan' },
  { wvs: 'Pasal 368', delik: 'Pemerasan (Afpersing)', baru: 482, catatan: 'Memaksa menyerahkan barang atau memberi utang/menghapus piutang dengan kekerasan' },
  { wvs: 'Pasal 372', delik: 'Penggelapan (Verduistering)', baru: 486, catatan: 'Memiliki secara melawan hukum barang dalam kekuasaannya bukan karena tindak pidana' },
  { wvs: 'Pasal 378', delik: 'Penipuan / Perbuatan Curang (Oplichting)', baru: 492, catatan: 'Nama/kedudukan palsu, tipu muslihat, atau rangkaian kata bohong' },
  { wvs: 'Pasal 406', delik: 'Perusakan Barang (Vernieling)', baru: 521, catatan: 'Merusak, menghancurkan, membuat tidak dapat dipakai, atau menghilangkan barang' },
  { wvs: 'Pasal 480', delik: 'Penadahan (Heling)', baru: 591, catatan: 'Membeli, menyewa, menerima gadai, atau menyimpan barang hasil tindak pidana' },
  { wvs: 'UU Tipikor Ps. 2', delik: 'Korupsi Merugikan Keuangan Negara', baru: 603, catatan: 'Memperkaya diri/orang lain/korporasi secara melawan hukum yang merugikan keuangan negara' },
  { wvs: 'UU Tipikor Ps. 3', delik: 'Korupsi Penyalahgunaan Kewenangan', baru: 604, catatan: 'Menyalahgunakan kewenangan, kesempatan, atau sarana jabatan/kedudukan' },
]


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
            { nilai: 'konversi', label: 'Konversi KUHP Lama' },
            { nilai: 'kalkulator', label: 'Kalkulator Pidana' },
          ]}
          onUbah={m => { setModus(m); reset() }}
        />
        {modus === 'konversi' && (
        <PanelKonversiWvs onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />
      )}

      {modus === 'kalkulator' && (
        <PanelKalkulatorPidana onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />
      )}

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
          <div className="row-gap" style={{ marginBottom: 9, paddingTop: 2 }}>
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

      {modus === 'konversi' && (
        <PanelKonversiWvs onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />
      )}

      {modus === 'kalkulator' && (
        <PanelKalkulatorPidana onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />
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


function PanelKonversiWvs({ onBukaPasal }: { onBukaPasal: (n: number) => void }) {
  const [cariWvs, setCariWvs] = useState('')
  const daftar = useMemo(() => {
    const t = cariWvs.trim().toLowerCase()
    if (!t) return KONVERSI_WVS
    return KONVERSI_WVS.filter(x =>
      x.wvs.toLowerCase().includes(t) ||
      x.delik.toLowerCase().includes(t) ||
      String(x.baru).includes(t) ||
      x.catatan.toLowerCase().includes(t)
    )
  }, [cariWvs])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kartu>
        <div className="row-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <IkonPemetaan size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Padanan KUHP Lama (WvS) ke UU No. 1 Tahun 2023</Label>
          <Chip nada="brand">{daftar.length} padanan populer</Chip>
        </div>
        <div className="topbar-cari" style={{ maxWidth: 460 }}>
          <IkonCari size={15} className="ikon-cari" />
          <input
            className="input"
            value={cariWvs}
            onChange={e => setCariWvs(e.target.value)}
            placeholder="Ketik nomor pasal lama (mis. 362, 378, 263, 55) atau nama delik…"
            style={{ paddingLeft: 34 }}
          />
        </div>
      </Kartu>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {daftar.map(item => {
          const pBaru = db.get(item.baru)
          return (
            <div key={item.wvs + item.baru} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <Chip nada="warn">{item.wvs} (WvS)</Chip>
                <IkonKanan size={13} style={{ color: 'var(--muted)' }} />
                <button
                  onClick={() => onBukaPasal(item.baru)}
                  style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-700)' }}
                >
                  Pasal {item.baru} (UU 1/2023)
                </button>
                <span style={{ fontSize: 13, fontWeight: 750 }}>{item.delik}</span>
                <span className="spacer" />
                <Tombol kecil onClick={() => onBukaPasal(item.baru)}>Buka Pasal {item.baru}</Tombol>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <b>Catatan perubahan:</b> {item.catatan}
              </div>
              {pBaru && (
                <div style={{
                  padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)',
                  border: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-doc)',
                  color: 'var(--text-soft)', lineHeight: 1.55,
                }}>
                  {htmlKeTeks(pBaru.teks)}
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--brand-700)', fontWeight: 650, marginTop: 4 }}>
                    Ancaman UU 1/2023: {ringkasAncaman(pBaru)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PanelKalkulatorPidana({ onBukaPasal }: { onBukaPasal: (n: number) => void }) {
  const [sub, setSub] = useState<'denda' | 'perbarengan' | 'daluwarsa'>('denda')
  const [kat, setKat] = useState<string>('II')
  const [dendaInput, setDendaInput] = useState<string>('10000000')
  const [terbayarInput, setTerbayarInput] = useState<string>('0')
  const [p1, setP1] = useState<number>(5)
  const [p2, setP2] = useState<number>(4)
  const [katDal, setKatDal] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('c')
  const [tglDelik, setTglDelik] = useState<string>(new Date().toISOString().slice(0, 10))
  const [anak, setAnak] = useState<boolean>(false)

  const nominal = Math.max(0, parseInt(dendaInput.replace(/\D/g, ''), 10) || 0)
  const dibayar = Math.min(nominal, Math.max(0, parseInt(terbayarInput.replace(/\D/g, ''), 10) || 0))
  const sisa = Math.max(0, nominal - dibayar)
  const unit = sisa > 0 ? Math.ceil(sisa / 50_000) : 0
  const bisaGanti = nominal <= DENDA_KATEGORI.II

  const terberat = Math.max(p1, p2)
  const jumlahPidana = p1 + p2
  const batasRealis = +(terberat + terberat / 3).toFixed(2)
  const maksRealis = Math.min(jumlahPidana, batasRealis)

  const tahunDal = { a: 3, b: 6, c: 12, d: 18, e: 20 }[katDal]
  const bulanDal = anak ? Math.round((tahunDal * 12) / 3) : tahunDal * 12
  const tglGugur = useMemo(() => {
    const d = new Date(tglDelik + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return '—'
    d.setDate(d.getDate() + 1)
    d.setMonth(d.getMonth() + bulanDal)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }, [tglDelik, bulanDal])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kartu>
        <div className="row-gap" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          <IkonPalu size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Kalkulator Pidana Buku Kesatu UU No. 1 Tahun 2023</Label>
          <span className="spacer" />
          <Segmen<'denda' | 'perbarengan' | 'daluwarsa'>
            nilai={sub}
            opsi={[
              { nilai: 'denda', label: 'Denda & Pengganti (Ps. 79 & 82)' },
              { nilai: 'perbarengan', label: 'Perbarengan (Ps. 125–127)' },
              { nilai: 'daluwarsa', label: 'Daluwarsa (Ps. 136–137)' },
            ]}
            onUbah={setSub}
          />
        </div>

        {sub === 'denda' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 7, marginBottom: 12 }}>
              {Object.entries(DENDA_KATEGORI).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => { setKat(k); setDendaInput(String(v)) }}
                  style={{
                    textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                    border: `1.5px solid ${kat === k ? 'var(--brand-500)' : 'var(--border)'}`,
                    background: kat === k ? 'var(--brand-50)' : 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 750 }}>Kategori {k}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{rupiah(v)}</div>
                </button>
              ))}
            </div>
            <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 4 }}>Denda dijatuhkan (Rp)</div>
                <input className="input mono" value={dendaInput} onChange={e => setDendaInput(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 4 }}>Telah dibayar (Rp)</div>
                <input className="input mono" value={terbayarInput} onChange={e => setTerbayarInput(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5 }}>
              {!bisaGanti ? (
                <span>Denda di atas <b>Kategori II ({rupiah(DENDA_KATEGORI.II)})</b> tidak diganti penjara/kerja sosial, melainkan dieksekusi melalui sita &amp; lelang kekayaan/pendapatan (Pasal 81 ayat (3) &amp; Pasal 82 ayat (1)).</span>
              ) : (
                <span>Sisa denda <b>{rupiah(sisa)}</b> setara <b>{angkaId(unit)} unit</b> (@Rp50.000 per Pasal 82 ayat (4)) → Pidana penjara/pengawasan pengganti: <b>{Math.min(365, Math.max(sisa > 0 ? 30 : 0, unit))} hari</b> atau kerja sosial pengganti: <b>{Math.min(240, Math.max(sisa > 0 ? 8 : 0, unit))} jam</b>.</span>
              )}
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Tombol kecil onClick={() => onBukaPasal(79)}>Buka Pasal 79</Tombol>
                <Tombol kecil onClick={() => onBukaPasal(82)}>Buka Pasal 82</Tombol>
              </div>
            </div>
          </div>
        )}

        {sub === 'perbarengan' && (
          <div>
            <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 4 }}>Ancaman Tindak Pidana 1 (tahun)</div>
                <input className="input mono" type="number" min={0} max={20} value={p1} onChange={e => setP1(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 4 }}>Ancaman Tindak Pidana 2 (tahun)</div>
                <input className="input mono" type="number" min={0} max={20} value={p2} onChange={e => setP2(Math.max(0, Number(e.target.value) || 0))} />
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, lineHeight: 1.6 }}>
              <div>• <b>Concursus Idealis (Pasal 125) / Perbuatan Berlanjut (Pasal 126):</b> Maksimum <b>{terberat} tahun</b> (1 pidana pokok terberat).</div>
              <div>• <b>Concursus Realis (Pasal 127 ayat (2)):</b> Maksimum <b>{maksRealis} tahun</b> (jumlah ancaman {jumlahPidana} tahun, dibatasi terberat + 1/3 yaitu {batasRealis} tahun).</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Tombol kecil onClick={() => onBukaPasal(125)}>Pasal 125</Tombol>
                <Tombol kecil onClick={() => onBukaPasal(126)}>Pasal 126</Tombol>
                <Tombol kecil onClick={() => onBukaPasal(127)}>Pasal 127</Tombol>
              </div>
            </div>
          </div>
        )}

        {sub === 'daluwarsa' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {([
                ['a', 'Ancaman penjara ≤ 1 tahun atau denda ≤ Kategori III → Daluwarsa 3 tahun'],
                ['b', 'Ancaman penjara > 1 tahun s.d. 3 tahun → Daluwarsa 6 tahun'],
                ['c', 'Ancaman penjara > 3 tahun s.d. 7 tahun → Daluwarsa 12 tahun'],
                ['d', 'Ancaman penjara > 7 tahun s.d. 15 tahun → Daluwarsa 18 tahun'],
                ['e', 'Ancaman penjara 20 tahun, seumur hidup, atau pidana mati → Daluwarsa 20 tahun'],
              ] as const).map(([id, ket]) => (
                <label key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
                  <input type="radio" checked={katDal === id} onChange={() => setKatDal(id)} />
                  <span><b>Huruf {id}:</b> {ket}</span>
                </label>
              ))}
            </div>
            <div className="grid-2" style={{ gap: 10, marginBottom: 12, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 4 }}>Tanggal Perbuatan (Tempus Delicti)</div>
                <input className="input" type="date" value={tglDelik} onChange={e => setTglDelik(e.target.value)} />
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, cursor: 'pointer', paddingBottom: 8 }}>
                <input type="checkbox" checked={anak} onChange={e => setAnak(e.target.checked)} />
                Pelaku Anak (dikurangi menjadi 1/3 per Pasal 136 ayat (2))
              </label>
            </div>
            <div style={{ padding: 12, borderRadius: 9, background: 'var(--brand-50)', border: '1px solid var(--brand-200)', fontSize: 12.5 }}>
              Tenggang daluwarsa: <b>{bulanDal / 12} tahun</b> (dihitung keesokan harinya per Pasal 137) → Kewenangan penuntutan gugur mulai <b>{tglGugur}</b>.
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Tombol kecil onClick={() => onBukaPasal(136)}>Buka Pasal 136</Tombol>
                <Tombol kecil onClick={() => onBukaPasal(137)}>Buka Pasal 137</Tombol>
              </div>
            </div>
          </div>
        )}
      </Kartu>
    </div>
  )
}

export type { Topik }
