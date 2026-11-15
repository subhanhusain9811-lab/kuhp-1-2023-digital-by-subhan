/* ============================================================
   Kalkulator Pidana & Daluwarsa Penuntutan
   Berdasarkan Buku Kesatu UU No. 1 Tahun 2023 (Pasal 79, 82, 125–127, 136–137)
   ============================================================ */
import { useMemo, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { DENDA_KATEGORI, rupiah, angkaId } from '@/lib/format'
import { Kartu, Chip, Label, Segmen, Tombol } from '@/components/ui'
import { IkonPalu, IkonJam, IkonSkala, IkonInfo, IkonTambah, IkonTutup } from '@/components/Ikon'

type TabKalkulator = 'denda' | 'perbarengan' | 'daluwarsa'

interface ItemPerbarengan {
  id: number
  label: string
  tahun: number
  bulan: number
}

export function CalculatorPage() {
  const navigasi = useStore(s => s.navigasi)
  const [tab, setTab] = useState<TabKalkulator>('denda')

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <div className="row-gap" style={{ marginBottom: 5 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'var(--brand-50)', color: 'var(--brand-700)',
          }}>
            <IkonSkala size={18} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em' }}>
            Kalkulator Pidana &amp; Daluwarsa
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 740 }}>
          Alat bantu hitung cepat berdasarkan ketentuan Buku Kesatu UU No. 1 Tahun 2023
          (Kategori Denda, Pidana Pengganti, Perbarengan, dan Kedaluwarsa Penuntutan).
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Segmen<TabKalkulator>
          nilai={tab}
          label="Jenis perhitungan pidana"
          opsi={[
            { nilai: 'denda', label: 'Denda & Pengganti' },
            { nilai: 'perbarengan', label: 'Perbarengan (Concursus)' },
            { nilai: 'daluwarsa', label: 'Daluwarsa Penuntutan' },
          ]}
          onUbah={setTab}
        />
      </div>

      {tab === 'denda' && <PanelDenda onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />}
      {tab === 'perbarengan' && <PanelPerbarengan onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />}
      {tab === 'daluwarsa' && <PanelDaluwarsa onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })} />}
    </div>
  )
}

/* ============================================================
   1. Kategori Denda & Pidana Pengganti (Pasal 79 & Pasal 82)
   ============================================================ */
function PanelDenda({ onBukaPasal }: { onBukaPasal: (n: number) => void }) {
  const [kategori, setKategori] = useState<string>('II')
  const [nominalCustom, setNominalCustom] = useState<string>('10000000')
  const [dibayarSebagian, setDibayarSebagian] = useState<string>('0')
  const [adaPerbarengan, setAdaPerbarengan] = useState(false)

  const nilaiKategori = DENDA_KATEGORI[kategori] ?? 10_000_000
  const nominal = Math.max(0, parseInt(nominalCustom.replace(/\D/g, ''), 10) || 0)
  const terbayar = Math.min(nominal, Math.max(0, parseInt(dibayarSebagian.replace(/\D/g, ''), 10) || 0))
  const sisaDenda = Math.max(0, nominal - terbayar)

  const bisaDiganti = nominal <= DENDA_KATEGORI.II
  // Pasal 82 ayat (4): setiap Rp50.000 atau kurang = 1 jam kerja sosial atau 1 hari penjara/pengawasan
  const unitPengganti = sisaDenda > 0 ? Math.ceil(sisaDenda / 50_000) : 0
  const jamKerjaSosial = bisaDiganti ? Math.min(240, Math.max(sisaDenda > 0 ? 8 : 0, unitPengganti)) : 0
  const hariPenjara = bisaDiganti
    ? Math.min(adaPerbarengan ? 485 : 365, Math.max(sisaDenda > 0 ? 30 : 0, unitPengganti))
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kartu>
        <div className="row-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <IkonPalu size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>1 · Pilih Kategori Denda (Pasal 79 ayat (1))</Label>
          <span className="spacer" />
          <Tombol kecil onClick={() => onBukaPasal(79)}>Buka Pasal 79</Tombol>
          <Tombol kecil onClick={() => onBukaPasal(82)}>Buka Pasal 82</Tombol>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
          {Object.entries(DENDA_KATEGORI).map(([k, v]) => {
            const aktif = kategori === k
            return (
              <button
                key={k}
                onClick={() => { setKategori(k); setNominalCustom(String(v)) }}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 9,
                  border: `1.5px solid ${aktif ? 'var(--brand-500)' : 'var(--border)'}`,
                  background: aktif ? 'var(--brand-50)' : 'var(--surface-2)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 750, color: aktif ? 'var(--brand-700)' : 'var(--text)' }}>
                  Kategori {k}
                </div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginTop: 2 }}>
                  {rupiah(v)}
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 5 }}>
              Nominal denda yang dijatuhkan (Rp)
            </label>
            <input
              className="input mono"
              inputMode="numeric"
              value={nominalCustom}
              onChange={e => setNominalCustom(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 10000000"
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Plafon Kategori {kategori}: <b>{rupiah(nilaiKategori)}</b>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 5 }}>
              Sebagian denda yang telah dibayar (Rp)
            </label>
            <input
              className="input mono"
              inputMode="numeric"
              value={dibayarSebagian}
              onChange={e => setDibayarSebagian(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Sisa denda belum dibayar: <b>{rupiah(sisaDenda)}</b>
            </div>
          </div>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={adaPerbarengan} onChange={e => setAdaPerbarengan(e.target.checked)} />
          Terdapat perbarengan (batas maksimal penjara pengganti 1 tahun 4 bulan per Pasal 82 ayat (2) huruf a)
        </label>
      </Kartu>

      <Kartu style={{ background: bisaDiganti ? 'var(--surface)' : 'var(--surface-2)' }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Hasil Perhitungan Pidana Pengganti (Pasal 82)</Label>
          <Chip nada={bisaDiganti ? 'ok' : 'warn'}>
            {bisaDiganti ? 'Memenuhi syarat pidana pengganti (≤ Kategori II)' : 'Di atas Kategori II — eksekusi sita/lelang'}
          </Chip>
        </div>

        {!bisaDiganti ? (
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>
            Sesuai <b>Pasal 82 ayat (1)</b>, pidana pengganti (penjara, pengawasan, atau kerja sosial) hanya berlaku jika
            pidana denda <b>tidak melebihi Kategori II ({rupiah(DENDA_KATEGORI.II)})</b>. Untuk denda di atas Kategori II,
            pelunasan dilakukan melalui penyitaan dan pelelangan kekayaan/pendapatan terpidana (Pasal 81 ayat (3)).
          </p>
        ) : (
          <div className="grid-3" style={{ gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>Unit Konversi (Rp50.000/unit)</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{angkaId(unitPengganti)} unit</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Pasal 82 ayat (4)</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>Penjara / Pengawasan Pengganti</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: 'var(--brand-700)' }}>
                {hariPenjara} hari
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Rentang UU: 1 bln – {adaPerbarengan ? '1 thn 4 bln' : '1 thn'}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>Kerja Sosial Pengganti</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: 'var(--brand-700)' }}>
                {jamKerjaSosial} jam
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Rentang UU: 8 – 240 jam</div>
            </div>
          </div>
        )}
      </Kartu>
    </div>
  )
}

/* ============================================================
   2. Perbarengan / Concursus (Pasal 125–127)
   ============================================================ */
function PanelPerbarengan({ onBukaPasal }: { onBukaPasal: (n: number) => void }) {
  const [jenis, setJenis] = useState<'realis' | 'idealis' | 'berlanjut'>('realis')
  const [items, setItems] = useState<ItemPerbarengan[]>([
    { id: 1, label: 'Tindak Pidana 1 (mis. Pasal 476)', tahun: 5, bulan: 0 },
    { id: 2, label: 'Tindak Pidana 2 (mis. Pasal 492)', tahun: 4, bulan: 0 },
  ])
  const [pasalTambah, setPasalTambah] = useState('')

  const hasil = useMemo(() => {
    const totalBulanList = items.map(it => Math.max(0, it.tahun * 12 + it.bulan))
    const terberat = totalBulanList.length ? Math.max(...totalBulanList) : 0
    const jumlahSemua = totalBulanList.reduce((a, b) => a + b, 0)
    const batasSepertiga = Math.floor(terberat + terberat / 3)
    const maks = jenis === 'realis' ? Math.min(jumlahSemua, batasSepertiga) : terberat
    return { terberat, jumlahSemua, batasSepertiga, maks }
  }, [items, jenis])

  const formatBulan = (total: number) => {
    const t = Math.floor(total / 12)
    const b = total % 12
    const bagian = []
    if (t > 0) bagian.push(`${t} tahun`)
    if (b > 0) bagian.push(`${b} bulan`)
    return bagian.length ? bagian.join(' ') : '0 bulan'
  }

  const tambahDariPasal = () => {
    const n = parseInt(pasalTambah, 10)
    const p = n ? db.get(n) : undefined
    const penjaraMax = p?.ancaman.penjara?.reduce((mx, [, val]) => Math.max(mx, val), 0) ?? 0
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        label: p ? `Pasal ${p.nomor} (${p.babJudul})` : `Tindak Pidana ${prev.length + 1}`,
        tahun: penjaraMax || 1,
        bulan: 0,
      },
    ])
    setPasalTambah('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kartu>
        <div className="row-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <IkonSkala size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Jenis Perbarengan</Label>
          <span className="spacer" />
          <Tombol kecil onClick={() => onBukaPasal(125)}>Pasal 125</Tombol>
          <Tombol kecil onClick={() => onBukaPasal(126)}>Pasal 126</Tombol>
          <Tombol kecil onClick={() => onBukaPasal(127)}>Pasal 127</Tombol>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Segmen<'realis' | 'idealis' | 'berlanjut'>
            nilai={jenis}
            opsi={[
              { nilai: 'realis', label: 'Perbarengan Beberapa TP (Ps. 127)' },
              { nilai: 'idealis', label: 'Satu Perbuatan (Ps. 125)' },
              { nilai: 'berlanjut', label: 'Perbuatan Berlanjut (Ps. 126)' },
            ]}
            onUbah={setJenis}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            className="input"
            value={pasalTambah}
            onChange={e => setPasalTambah(e.target.value)}
            placeholder="Isi nomor pasal (opsional) lalu Tambah…"
            inputMode="numeric"
            style={{ maxWidth: 260, minHeight: 36, fontSize: 12.5 }}
          />
          <Tombol kecil ikon={<IkonTambah size={13} />} onClick={tambahDariPasal}>
            Tambah Tindak Pidana
          </Tombol>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, idx) => (
            <div key={it.id} style={{
              display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px 90px 32px', gap: 8, alignItems: 'center',
              padding: 10, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <input
                className="input"
                value={it.label}
                onChange={e => setItems(prev => prev.map(x => x.id === it.id ? { ...x, label: e.target.value } : x))}
                style={{ minHeight: 34, fontSize: 12.5 }}
                aria-label={`Nama tindak pidana ${idx + 1}`}
              />
              <input
                className="input mono"
                type="number" min={0} max={20}
                value={it.tahun}
                onChange={e => setItems(prev => prev.map(x => x.id === it.id ? { ...x, tahun: Math.max(0, Number(e.target.value) || 0) } : x))}
                style={{ minHeight: 34, fontSize: 12.5 }}
                title="Tahun"
                aria-label={`Tahun pidana ${idx + 1}`}
              />
              <input
                className="input mono"
                type="number" min={0} max={11}
                value={it.bulan}
                onChange={e => setItems(prev => prev.map(x => x.id === it.id ? { ...x, bulan: Math.min(11, Math.max(0, Number(e.target.value) || 0)) } : x))}
                style={{ minHeight: 34, fontSize: 12.5 }}
                title="Bulan"
                aria-label={`Bulan pidana ${idx + 1}`}
              />
              <button
                onClick={() => items.length > 1 && setItems(prev => prev.filter(x => x.id !== it.id))}
                disabled={items.length <= 1}
                aria-label="Hapus baris"
                style={{ color: 'var(--muted)', opacity: items.length <= 1 ? 0.35 : 1 }}
              >
                <IkonTutup size={15} />
              </button>
            </div>
          ))}
        </div>
      </Kartu>

      <Kartu>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Hasil Maksimum Ancaman Pidana</Label>
          <Chip nada="brand">
            {jenis === 'realis' ? 'Pasal 127 ayat (2)' : jenis === 'idealis' ? 'Pasal 125 ayat (1)' : 'Pasal 126 ayat (2)'}
          </Chip>
        </div>
        <div className="grid-3" style={{ gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>Pidana Pokok Terberat</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{formatBulan(hasil.terberat)}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>
              {jenis === 'realis' ? 'Batas Terberat + 1/3' : 'Akumulasi Nominal'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {jenis === 'realis' ? formatBulan(hasil.batasSepertiga) : formatBulan(hasil.jumlahSemua)}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
            <div style={{ fontSize: 11, color: 'var(--brand-700)', fontWeight: 700 }}>Maksimum yang Dapat Dijatuhkan</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: 'var(--brand-700)' }}>
              {formatBulan(hasil.maks)}
            </div>
          </div>
        </div>
      </Kartu>
    </div>
  )
}

/* ============================================================
   3. Daluwarsa Penuntutan (Pasal 136 & Pasal 137)
   ============================================================ */
function PanelDaluwarsa({ onBukaPasal }: { onBukaPasal: (n: number) => void }) {
  const [kategoriAncaman, setKategoriAncaman] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('c')
  const [tanggalPerbuatan, setTanggalPerbuatan] = useState<string>(new Date().toISOString().slice(0, 10))
  const [pelakuAnak, setPelakuAnak] = useState(false)

  const tenggangTahunDasar = { a: 3, b: 6, c: 12, d: 18, e: 20 }[kategoriAncaman]
  const tenggangBulan = pelakuAnak ? Math.round((tenggangTahunDasar * 12) / 3) : tenggangTahunDasar * 12

  const tanggalKedaluwarsa = useMemo(() => {
    const d = new Date(tanggalPerbuatan + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return null
    // Pasal 137: dihitung mulai keesokan hari setelah perbuatan dilakukan
    d.setDate(d.getDate() + 1)
    d.setMonth(d.getMonth() + tenggangBulan)
    return d
  }, [tanggalPerbuatan, tenggangBulan])

  const sudahGugur = tanggalKedaluwarsa ? Date.now() >= tanggalKedaluwarsa.getTime() : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kartu>
        <div className="row-gap" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <IkonJam size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Parameter Kedaluwarsa (Pasal 136–137)</Label>
          <span className="spacer" />
          <Tombol kecil onClick={() => onBukaPasal(136)}>Buka Pasal 136</Tombol>
          <Tombol kecil onClick={() => onBukaPasal(137)}>Buka Pasal 137</Tombol>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {([
            ['a', 'Penjara paling lama 1 tahun dan/atau hanya denda paling banyak Kategori III → 3 tahun'],
            ['b', 'Penjara di atas 1 tahun s.d. paling lama 3 tahun → 6 tahun'],
            ['c', 'Penjara di atas 3 tahun s.d. paling lama 7 tahun → 12 tahun'],
            ['d', 'Penjara di atas 7 tahun s.d. paling lama 15 tahun → 18 tahun'],
            ['e', 'Penjara paling lama 20 tahun, seumur hidup, atau pidana mati → 20 tahun'],
          ] as const).map(([id, label]) => (
            <label key={id} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 8,
              border: `1px solid ${kategoriAncaman === id ? 'var(--brand-500)' : 'var(--border)'}`,
              background: kategoriAncaman === id ? 'var(--brand-50)' : 'var(--surface-2)',
              cursor: 'pointer', fontSize: 12.5,
            }}>
              <input
                type="radio" name="kat-daluwarsa"
                checked={kategoriAncaman === id}
                onChange={() => setKategoriAncaman(id)}
              />
              <span><b>Huruf {id}.</b> {label}</span>
            </label>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 5 }}>
              Tanggal perbuatan dilakukan (Tempus Delicti)
            </label>
            <input
              className="input"
              type="date"
              value={tanggalPerbuatan}
              onChange={e => setTanggalPerbuatan(e.target.value)}
            />
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9,
            background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5,
          }}>
            <input type="checkbox" checked={pelakuAnak} onChange={e => setPelakuAnak(e.target.checked)} />
            Pelaku adalah Anak (dikurangi menjadi 1/3 per Pasal 136 ayat (2))
          </label>
        </div>
      </Kartu>

      <Kartu>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Hasil Tenggang Waktu Penuntutan</Label>
          <Chip nada={sudahGugur ? 'danger' : 'ok'}>
            {sudahGugur ? 'Melewati Batas Daluwarsa' : 'Masih dalam Tenggang Penuntutan'}
          </Chip>
        </div>
        <div className="grid-2" style={{ gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>Tenggang Waktu Daluwarsa</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              {tenggangBulan / 12} tahun {pelakuAnak ? '(1/3 Anak)' : ''}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
            <div style={{ fontSize: 11, color: 'var(--brand-700)', fontWeight: 700 }}>Gugur Penuntutan Mulai Tanggal</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, color: 'var(--brand-700)' }}>
              {tanggalKedaluwarsa
                ? tanggalKedaluwarsa.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55 }}>
          <IkonInfo size={13} style={{ flex: 'none', marginTop: 2 }} />
          <span>
            Dihitung mulai keesokan hari setelah perbuatan dilakukan (Pasal 137), kecuali untuk pemalsuan/perusakan mata uang
            atau tindak pidana tertentu yang dihitung sejak barang digunakan atau korban berusia 18 tahun.
          </span>
        </div>
      </Kartu>
    </div>
  )
}
