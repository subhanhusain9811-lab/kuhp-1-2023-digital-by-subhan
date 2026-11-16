/* ============================================================
   Palet Perintah (Ctrl/⌘ + K)
   Navigasi cepat: pasal, modul, dan aksi.
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { norm } from '@/search/normalize'
import type { Rute } from '@/lib/types'
import {
  IkonCari, IkonRumah, IkonBuku, IkonDaftar, IkonSimpan, IkonPemetaan,
  IkonCatatan, IkonAsisten, IkonEkspor, IkonPengaturan, IkonPerisai, IkonTema,
} from './Ikon'

interface Item {
  id: string
  label: string
  meta?: string
  ikon: React.ReactNode
  jalankan: () => void
}

export function CommandPalette() {
  const buka = useStore(s => s.paletBuka)
  const setPalet = useStore(s => s.setPalet)
  const navigasi = useStore(s => s.navigasi)
  const toggleTema = useStore(s => s.toggleTema)
  const [q, setQ] = useState('')
  const [aktif, setAktif] = useState(0)
  const refInput = useRef<HTMLInputElement>(null)
  const refList = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (buka) {
      setQ(''); setAktif(0)
      setTimeout(() => refInput.current?.focus(), 40)
    }
  }, [buka])

  const modul: Item[] = useMemo(() => [
    { id: 'm-dash', label: 'Beranda', ikon: <IkonRumah size={15} />, jalankan: () => navigasi({ nama: 'dashboard' }) },
    { id: 'm-cari', label: 'Pencarian hibrida', ikon: <IkonCari size={15} />, jalankan: () => navigasi({ nama: 'cari' }) },
    { id: 'm-toc', label: 'Daftar isi', ikon: <IkonDaftar size={15} />, jalankan: () => navigasi({ nama: 'daftar-isi' }) },
    { id: 'm-p1', label: 'Baca Pasal 1', ikon: <IkonBuku size={15} />, jalankan: () => navigasi({ nama: 'baca', pasal: 1 }) },
    { id: 'm-map', label: 'Pemetaan hukum', ikon: <IkonPemetaan size={15} />, jalankan: () => navigasi({ nama: 'pemetaan' }) },
    { id: 'm-2026', label: 'UU 1/2026 — Penyesuaian Pidana', ikon: <IkonPerisai size={15} />, jalankan: () => navigasi({ nama: 'penyesuaian' }) },
    { id: 'm-lib', label: 'Bookmark & riwayat', ikon: <IkonSimpan size={15} />, jalankan: () => navigasi({ nama: 'pustaka' }) },
    { id: 'm-note', label: 'Catatan pribadi', ikon: <IkonCatatan size={15} />, jalankan: () => navigasi({ nama: 'catatan' }) },
    { id: 'm-ai', label: 'Asisten hukum', ikon: <IkonAsisten size={15} />, jalankan: () => navigasi({ nama: 'asisten' }) },
    { id: 'm-exp', label: 'Ekspor & cetak', ikon: <IkonEkspor size={15} />, jalankan: () => navigasi({ nama: 'ekspor' }) },
    { id: 'm-set', label: 'Pengaturan', ikon: <IkonPengaturan size={15} />, jalankan: () => navigasi({ nama: 'pengaturan' }) },
    { id: 'm-abt', label: 'Sumber & integritas', ikon: <IkonPerisai size={15} />, jalankan: () => navigasi({ nama: 'tentang' }) },
    { id: 'a-tema', label: 'Ganti tema terang/gelap', ikon: <IkonTema size={15} />, jalankan: toggleTema },
  ], [navigasi, toggleTema])

  const hasil = useMemo(() => {
    const t = norm(q)
    if (!t) return modul.slice(0, 8)

    // pasal berdasarkan nomor
    const angka = t.match(/^(?:pasal\s*)?(\d{1,3})$/)
    if (angka) {
      const n = parseInt(angka[1], 10)
      const p = db.get(n)
      if (p) {
        return [{
          id: 'p' + n, label: `Pasal ${n}`, meta: p.babJudul,
          ikon: <IkonBuku size={15} />,
          jalankan: () => navigasi({ nama: 'baca', pasal: n }),
        } satisfies Item]
      }
    }

    const modulCocok = modul.filter(m => norm(m.label).includes(t))
    const pasalCocok: Item[] = []
    for (const p of db.pasal) {
      if (String(p.nomor) === t || norm(p.babJudul).includes(t)) {
        pasalCocok.push({
          id: 'p' + p.nomor,
          label: `Pasal ${p.nomor}`,
          meta: p.babJudul,
          ikon: <IkonBuku size={15} />,
          jalankan: () => navigasi({ nama: 'baca', pasal: p.nomor }),
        })
        if (pasalCocok.length >= 6) break
      }
    }
    const cariItem: Item = {
      id: 'cari-q', label: `Cari "${q}" di seluruh pasal`, ikon: <IkonCari size={15} />,
      jalankan: () => navigasi({ nama: 'cari', q }),
    }
    return [cariItem, ...modulCocok.slice(0, 3), ...pasalCocok]
  }, [q, modul, navigasi])

  const pilih = (it: Item) => {
    it.jalankan()
    setPalet(false)
  }

  useEffect(() => {
    if (!buka) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPalet(false); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setAktif(a => Math.min(hasil.length - 1, a + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setAktif(a => Math.max(0, a - 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const it = hasil[aktif]
        if (it) pilih(it)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [buka, hasil, aktif, setPalet])

  useEffect(() => {
    const el = refList.current?.children[aktif] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [aktif])

  if (!buka) return null

  return (
    <div className="palet-backdrop" onClick={e => { if (e.target === e.currentTarget) setPalet(false) }}
      role="presentation">
      <div className="palet" role="dialog" aria-modal="true" aria-label="Palet perintah">
        <input
          ref={refInput}
          className="palet-input"
          value={q}
          onChange={e => { setQ(e.target.value); setAktif(0) }}
          placeholder="Ketik nomor pasal, nama modul, atau kata kunci…"
          aria-label="Perintah"
        />
        <div className="palet-hasil" ref={refList} role="listbox">
          {hasil.length === 0 && (
            <div style={{ padding: 16, fontSize: 12.5, color: 'var(--muted)', textAlign: 'center' }}>
              Tidak ada perintah yang cocok.
            </div>
          )}
          {hasil.map((it, i) => (
            <button
              key={it.id}
              role="option"
              aria-selected={i === aktif}
              data-aktif={i === aktif ? 'ya' : undefined}
              className="palet-item"
              onMouseEnter={() => setAktif(i)}
              onClick={() => pilih(it)}
            >
              <span style={{ display: 'flex', flex: 'none' }}>{it.ikon}</span>
              <span className="truncate">{it.label}</span>
              {it.meta && <span className="palet-meta truncate">{it.meta}</span>}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex', gap: 10, padding: '8px 14px', borderTop: '1px solid var(--border)',
          fontSize: 10.5, color: 'var(--muted)', fontWeight: 600,
        }}>
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> pilih</span>
          <span><span className="kbd">Enter</span> buka</span>
          <span><span className="kbd">Esc</span> tutup</span>
        </div>
      </div>
    </div>
  )
}

export type { Rute }
