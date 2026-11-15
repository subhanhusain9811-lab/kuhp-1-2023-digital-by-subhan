/* ============================================================
   Pengaturan — tema, tipografi baca, tampilan, data lokal
   ============================================================ */
import { useRef, useState, type ChangeEvent } from 'react'
import { useStore } from '@/store/useStore'
import { db } from '@/lib/data'
import { Kartu, Chip, Tombol, Label, Segmen, Modal } from '@/components/ui'
import {
  IkonPengaturan, IkonTema, IkonMatahari, IkonPerbesar, IkonPerkecil,
  IkonSampah, IkonInfo, IkonPerisai, IkonCentang, IkonUnduh, IkonBuku,
} from '@/components/Ikon'
import { unduh } from '@/lib/format'

export function SettingsPage() {
  const tema = useStore(s => s.tema)
  const setTema = useStore(s => s.setTema)
  const preferensi = useStore(s => s.preferensi)
  const setPreferensi = useStore(s => s.setPreferensi)
  const resetPreferensi = useStore(s => s.resetPreferensi)
  const bookmark = useStore(s => s.bookmark)
  const catatan = useStore(s => s.catatan)
  const analisis = useStore(s => s.analisis)
  const riwayat = useStore(s => s.riwayat)
  const riwayatCari = useStore(s => s.riwayatCari)
  const kosongkanRiwayat = useStore(s => s.kosongkanRiwayat)
  const kosongkanCari = useStore(s => s.kosongkanCari)
  const tampilkanToast = useStore(s => s.tampilkanToast)
  const pulihkanCadangan = useStore(s => s.pulihkanCadangan)
  const [konfirmasi, setKonfirmasi] = useState<null | 'riwayat' | 'cari' | 'semua'>(null)
  const [berkasImpor, setBerkasImpor] = useState<null | {
    nama: string
    data: {
      bookmark?: unknown[]
      catatan?: unknown[]
      analisis?: unknown[]
      riwayat?: unknown[]
      riwayatCari?: string[]
      preferensi?: Record<string, unknown>
      tema?: 'terang' | 'gelap' | 'sistem'
    }
  }>(null)
  const refImpor = useRef<HTMLInputElement>(null)

  const cadangkan = () => {
    const data = {
      aplikasi: 'KUHP DIGITAL',
      versiData: db.meta.versiData,
      dibuat: new Date().toISOString(),
      bookmark, catatan, analisis, riwayat, riwayatCari, preferensi, tema,
    }
    unduh(`kuhp-cadangan-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2), 'application/json')
    tampilkanToast('Cadangan data diunduh')
  }

  const pilihBerkas = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? ''))
        if (!parsed || typeof parsed !== 'object' || (
          !Array.isArray(parsed.bookmark) && !Array.isArray(parsed.catatan) && !Array.isArray(parsed.analisis)
        )) {
          tampilkanToast('Format berkas cadangan tidak valid', 'galat')
          return
        }
        setBerkasImpor({ nama: file.name, data: parsed })
      } catch {
        tampilkanToast('Gagal membaca berkas JSON', 'galat')
      }
    }
    reader.readAsText(file)
  }

  const hapusSemua = () => {
    try { localStorage.removeItem('kuhp:store') } catch { /* noop */ }
    location.reload()
  }

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <div className="row-gap" style={{ marginBottom: 5 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'var(--surface-2)', color: 'var(--muted)',
          }}><IkonPengaturan size={18} /></div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em' }}>Pengaturan</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Sesuaikan tampilan dan kelola data yang tersimpan di perangkat ini.
        </p>
      </div>

      {/* Tema */}
      <Kartu style={{ marginBottom: 12 }}>
        <div className="row-gap" style={{ marginBottom: 11 }}>
          <IkonTema size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Tema Tampilan</Label>
        </div>
        <div className="grid-3" style={{ gap: 9 }}>
          {([
            { id: 'terang', label: 'Terang', ikon: <IkonMatahari size={17} />, ket: 'Latar putih, nyaman siang hari' },
            { id: 'gelap', label: 'Gelap', ikon: <IkonTema size={17} />, ket: 'Latar gelap, hemat mata' },
            { id: 'sistem', label: 'Ikuti Sistem', ikon: <IkonPengaturan size={17} />, ket: 'Menyesuaikan perangkat' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTema(t.id)}
              style={{
                textAlign: 'left', padding: 12, borderRadius: 10,
                border: `1.5px solid ${tema === t.id ? 'var(--brand-500)' : 'var(--border)'}`,
                background: tema === t.id ? 'var(--brand-50)' : 'var(--surface)',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ color: tema === t.id ? 'var(--brand-700)' : 'var(--muted)' }}>{t.ikon}</span>
                <span style={{ fontWeight: 750, fontSize: 13 }}>{t.label}</span>
                {tema === t.id && <IkonCentang size={13} style={{ marginLeft: 'auto', color: 'var(--brand-600)' }} />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{t.ket}</div>
            </button>
          ))}
        </div>
      </Kartu>

      {/* Tipografi baca */}
      <Kartu style={{ marginBottom: 12 }}>
        <div className="row-gap" style={{ marginBottom: 11 }}>
          <IkonBuku size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Tipografi Baca</Label>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 100 }}>Ukuran huruf</span>
          <Segmen<number>
            nilai={preferensi.ukuranHuruf} label="Ukuran huruf"
            opsi={[{ nilai: 0, label: 'Kecil' }, { nilai: 1, label: 'Normal' }, { nilai: 2, label: 'Besar' }, { nilai: 3, label: 'XL' }]}
            onUbah={v => setPreferensi({ ukuranHuruf: v })}
          />
          <span className="spacer" />
          <Tombol kecil ikon={<IkonPerkecil size={13} />} aria-label="Perkecil"
            onClick={() => setPreferensi({ ukuranHuruf: Math.max(0, preferensi.ukuranHuruf - 1) })} />
          <Tombol kecil ikon={<IkonPerbesar size={13} />} aria-label="Perbesar"
            onClick={() => setPreferensi({ ukuranHuruf: Math.min(3, preferensi.ukuranHuruf + 1) })} />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 100 }}>Lebar kolom</span>
          <Segmen<number>
            nilai={preferensi.lebarBaca} label="Lebar kolom baca"
            opsi={[{ nilai: 580, label: 'Sempit' }, { nilai: 680, label: 'Sedang' }, { nilai: 820, label: 'Lebar' }]}
            onUbah={v => setPreferensi({ lebarBaca: v })}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 100 }}>Jarak baris</span>
          <Segmen<number>
            nilai={preferensi.jarakBaris} label="Jarak baris"
            opsi={[{ nilai: 1.55, label: 'Rapat' }, { nilai: 1.72, label: 'Normal' }, { nilai: 1.95, label: 'Longgar' }]}
            onUbah={v => setPreferensi({ jarakBaris: v })}
          />
        </div>

        {/* pratinjau */}
        <div style={{
          marginTop: 6, padding: 13, borderRadius: 9, background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 6 }}>
            PRATINJAU
          </div>
          <p style={{
            fontFamily: 'var(--font-doc)',
            fontSize: [15, 17, 19, 22][preferensi.ukuranHuruf],
            lineHeight: preferensi.jarakBaris,
            maxWidth: preferensi.lebarBaca,
            margin: 0, color: 'var(--text-soft)',
          }}>
            Setiap Orang yang mengambil suatu Barang yang sebagian atau seluruhnya milik orang lain,
            dengan maksud untuk dimiliki secara melawan hukum, dipidana karena pencurian.
          </p>
        </div>
      </Kartu>

      {/* Tampilan bagian */}
      <Kartu style={{ marginBottom: 12 }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <IkonInfo size={15} style={{ color: 'var(--brand-700)' }} />
          <Label>Bagian yang Ditampilkan saat Membaca</Label>
        </div>
        {([
          ['tampilkanPenjelasan', 'Penjelasan pasal', 'Tampilkan lampiran penjelasan resmi di bawah redaksi'],
          ['tampilkanAncaman', 'Ringkasan ancaman', 'Ringkasan otomatis pidana yang diancamkan'],
          ['tampilkanRujukan', 'Rujukan antar-pasal', 'Pasal lain yang disebut dalam redaksi'],
          ['tampilkanKoreksi', 'Catatan koreksi', 'Keterangan bila redaksi memuat koreksi sumber'],
          ['simpanRiwayat', 'Simpan riwayat baca', 'Catat pasal yang dibuka untuk fitur lanjut baca'],
        ] as const).map(([kunci, judul, ket]) => (
          <label key={kunci} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
            borderBottom: '1px solid var(--border)', cursor: 'pointer',
          }}>
            <input type="checkbox" checked={preferensi[kunci] as boolean}
              onChange={e => setPreferensi({ [kunci]: e.target.checked })}
              style={{ marginTop: 2 }} />
            <span>
              <span style={{ fontSize: 13, fontWeight: 650, display: 'block' }}>{judul}</span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{ket}</span>
            </span>
          </label>
        ))}
        <div style={{ marginTop: 12 }}>
          <Tombol kecil onClick={() => { resetPreferensi(); tampilkanToast('Preferensi dikembalikan ke awal') }}>
            Kembalikan ke pengaturan awal
          </Tombol>
        </div>
      </Kartu>

      {/* Data lokal */}
      <Kartu style={{ marginBottom: 12 }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <IkonPerisai size={15} style={{ color: 'var(--ok)' }} />
          <Label>Data Lokal Anda</Label>
          <Chip nada="ok" ikon={<IkonPerisai size={10} />}>hanya di perangkat</Chip>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 9, marginBottom: 13 }}>
          {[
            ['Bookmark', bookmark.length],
            ['Catatan', catatan.length],
            ['Analisis', analisis.length],
            ['Riwayat baca', riwayat.length],
            ['Riwayat cari', riwayatCari.length],
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

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <Tombol kecil ikon={<IkonUnduh size={13} />} onClick={cadangkan}>Unduh cadangan</Tombol>
          <input
            ref={refImpor}
            type="file"
            accept=".json,application/json"
            onChange={pilihBerkas}
            style={{ display: 'none' }}
            aria-label="Pilih berkas cadangan JSON"
          />
          <Tombol kecil ikon={<IkonBuku size={13} />} onClick={() => refImpor.current?.click()}>
            Pulihkan cadangan
          </Tombol>
          <Tombol kecil nada="danger" ikon={<IkonSampah size={13} />}
            onClick={() => setKonfirmasi('riwayat')} disabled={riwayat.length === 0}>
            Hapus riwayat baca
          </Tombol>
          <Tombol kecil nada="danger" ikon={<IkonSampah size={13} />}
            onClick={() => setKonfirmasi('cari')} disabled={riwayatCari.length === 0}>
            Hapus riwayat cari
          </Tombol>
          <Tombol kecil nada="danger" ikon={<IkonSampah size={13} />}
            onClick={() => setKonfirmasi('semua')}>
            Hapus semua data
          </Tombol>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>
          Bookmark, catatan, analisis, dan riwayat disimpan pada penyimpanan lokal peramban.
          Menghapus data peramban atau berpindah perangkat akan menghilangkan data ini —
          gunakan tombol cadangan bila ingin menyimpannya.
        </p>
      </Kartu>

      {/* Pintasan papan tombol */}
      <Kartu style={{ marginBottom: 12 }}>
        <div className="row-gap" style={{ marginBottom: 10 }}>
          <Label>Pintasan Papan Tombol</Label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '7px 20px' }}>
          {[
            ['Ctrl / ⌘ + K', 'Buka pencarian cepat'],
            ['Ctrl / ⌘ + B', 'Tampilkan/sembunyikan sidebar'],
            ['← / →', 'Pasal sebelumnya / berikutnya'],
            ['Esc', 'Tutup dialog atau palet'],
            ['/', 'Fokus ke kotak pencarian'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
              <span className="kbd" style={{ fontSize: 10 }}>{k}</span>
              <span style={{ color: 'var(--muted)' }}>{v}</span>
            </div>
          ))}
        </div>
      </Kartu>

      <Kartu style={{ background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <IkonInfo size={15} style={{ color: 'var(--muted)', flex: 'none', marginTop: 1 }} />
          <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.65 }}>
            <b>KUHP DIGITAL {db.meta.versiData}</b> · data dibangun {db.meta.tanggalBangun} ·{' '}
            {db.meta.statistik.pasal} pasal · {db.meta.statistik.pasalDikoreksi} pasal dikoreksi.
            Preferensi awal tersimpan di <span className="mono">kuhp:store</span>.
          </div>
        </div>
      </Kartu>

      <Modal buka={!!konfirmasi} onTutup={() => setKonfirmasi(null)} judul="Konfirmasi Hapus Data" lebar={430}>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-soft)', marginBottom: 14 }}>
          {konfirmasi === 'riwayat' && 'Riwayat baca akan dihapus permanen dari perangkat ini.'}
          {konfirmasi === 'cari' && 'Riwayat pencarian akan dihapus permanen dari perangkat ini.'}
          {konfirmasi === 'semua' && 'Seluruh data lokal — bookmark, catatan, analisis, riwayat, dan preferensi — akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Tombol onClick={() => setKonfirmasi(null)}>Batal</Tombol>
          <Tombol nada="danger" onClick={() => {
            if (konfirmasi === 'riwayat') { kosongkanRiwayat(); tampilkanToast('Riwayat baca dihapus') }
            if (konfirmasi === 'cari') { kosongkanCari(); tampilkanToast('Riwayat cari dihapus') }
            if (konfirmasi === 'semua') { hapusSemua(); return }
            setKonfirmasi(null)
          }}>
            Ya, hapus
          </Tombol>
        </div>
      </Modal>

      <Modal buka={berkasImpor !== null} onTutup={() => setBerkasImpor(null)} judul="Pulihkan Cadangan Data">
        {berkasImpor && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 10 }}>
              Berkas <b>{berkasImpor.nama}</b> memuat:
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14,
              padding: 10, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)',
              fontSize: 12,
            }}>
              <div><b>{Array.isArray(berkasImpor.data.bookmark) ? berkasImpor.data.bookmark.length : 0}</b> bookmark</div>
              <div><b>{Array.isArray(berkasImpor.data.catatan) ? berkasImpor.data.catatan.length : 0}</b> catatan</div>
              <div><b>{Array.isArray(berkasImpor.data.analisis) ? berkasImpor.data.analisis.length : 0}</b> analisis</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 14 }}>
              Pilih <b>Gabung</b> untuk menambahkan item baru tanpa menghapus data Anda saat ini, atau <b>Timpa</b> untuk mengganti seluruh data lokal.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Tombol onClick={() => setBerkasImpor(null)}>Batal</Tombol>
              <Tombol nada="primary" onClick={() => {
                pulihkanCadangan(berkasImpor.data as Parameters<typeof pulihkanCadangan>[0], 'gabung')
                setBerkasImpor(null)
                tampilkanToast('Cadangan digabung ke data saat ini')
              }}>
                Gabung data
              </Tombol>
              <Tombol nada="danger" onClick={() => {
                pulihkanCadangan(berkasImpor.data as Parameters<typeof pulihkanCadangan>[0], 'timpa')
                setBerkasImpor(null)
                tampilkanToast('Data lokal dipulihkan dari cadangan')
              }}>
                Timpa semua
              </Tombol>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
