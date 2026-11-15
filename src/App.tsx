/* ============================================================
   KUHP DIGITAL — Kerangka aplikasi & penjurusan modul
   ============================================================ */
import { useEffect, useState } from 'react'
import { useStore, pakaiTema } from '@/store/useStore'

import { hashKeRute, ruteKeHash } from '@/lib/router'
import { Sidebar } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { ToastHost } from '@/components/ui'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { Reader } from '@/features/reader/Reader'
import { SearchPage } from '@/features/search/SearchPage'
import { TocPage } from '@/features/nav/TocPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { MappingPage } from '@/features/mapping/MappingPage'
import { NotesPage, AnalysisPage } from '@/features/notes/NotesPage'
import { AssistantPage } from '@/features/ai/AssistantPage'
import { CalculatorPage } from '@/features/calculator/CalculatorPage'
import { ExportPage } from '@/features/export/ExportPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { AboutPage } from '@/features/about/AboutPage'
import { IkonMenu, IkonCari, IkonTema, IkonMatahari } from '@/components/Ikon'

const LABEL_RUTE: Record<string, string> = {
  dashboard: 'Beranda',
  baca: 'Membaca Pasal',
  'daftar-isi': 'Daftar Isi',
  cari: 'Pencarian',
  pustaka: 'Pustaka Saya',
  pemetaan: 'Pemetaan Hukum',
  catatan: 'Catatan Pribadi',
  analisis: 'Ruang Analisis',
  asisten: 'Asisten Hukum',
  kalkulator: 'Kalkulator Pidana',
  ekspor: 'Ekspor & Cetak',
  pengaturan: 'Pengaturan',
  tentang: 'Sumber & Integritas',
}

export default function App() {
  const rute = useStore(s => s.rute)
  const navigasi = useStore(s => s.navigasi)
  const sidebarBuka = useStore(s => s.sidebarBuka)
  const setSidebar = useStore(s => s.setSidebar)
  const setPalet = useStore(s => s.setPalet)
  const tema = useStore(s => s.tema)
  const toggleTema = useStore(s => s.toggleTema)
  const preferensi = useStore(s => s.preferensi)

  pakaiTema()

  const [cariCepat, setCariCepat] = useState('')

  /* ---------- Sinkronisasi rute <-> hash ---------- */
  const sinkronHash = useStore(s => s.sinkronHash)
  useEffect(() => {
    // baca hash awal
    const awal = hashKeRute(window.location.hash)
    if (window.location.hash) sinkronHash(awal)
    else window.history.replaceState(null, '', ruteKeHash(awal))

    const onPop = () => sinkronHash(hashKeRute(window.location.hash))
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onPop)
    }
  }, [sinkronHash])

  /* tema + ukuran huruf ke <html> */
  useEffect(() => {
    document.documentElement.setAttribute('data-ukuran', String(preferensi.ukuranHuruf))
  }, [preferensi.ukuranHuruf])

  /* rerender saat preferensi sistem berubah */
  useEffect(() => {
    if (tema !== 'sistem') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => {
      document.documentElement.setAttribute('data-tema', mq.matches ? 'gelap' : 'terang')
    }
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [tema])

  /* pintasan papan tombol global */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const diInput = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalet(true)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setSidebar(!useStore.getState().sidebarBuka)
        return
      }
      if (e.key === '/' && !diInput) {
        e.preventDefault()
        setPalet(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPalet, setSidebar])

  /* judul dokumen */
  useEffect(() => {
    if (rute.nama === 'baca') {
      document.title = `Pasal ${rute.pasal} — KUHP Digital`
    } else {
      document.title = `${LABEL_RUTE[rute.nama] ?? 'KUHP Digital'} — KUHP Digital`
    }
  }, [rute])

  const kirimCepat = () => {
    const t = cariCepat.trim()
    if (!t) return
    navigasi({ nama: 'cari', q: t })
    setCariCepat('')
  }

  const judul =
    rute.nama === 'baca' ? `Pasal ${rute.pasal}`
      : rute.nama === 'cari' ? 'Pencarian'
        : LABEL_RUTE[rute.nama] ?? 'KUHP Digital'

  return (
    <div className="app" data-sidebar={sidebarBuka ? 'buka' : 'tutup'}>
      <Sidebar />

      {sidebarBuka && (
        <button className="backdrop" onClick={() => setSidebar(false)} aria-label="Tutup menu" />
      )}

      <div className="main">
        <header className="topbar">
          <button
            className="btn btn-icon btn-ghost tampil-mobile"
            onClick={() => setSidebar(true)}
            aria-label="Buka menu navigasi"
          >
            <IkonMenu size={19} />
          </button>

          <div className="topbar-title">{judul}</div>

          <form className="topbar-cari" onSubmit={e => { e.preventDefault(); kirimCepat() }}>
            <IkonCari size={15} className="ikon-cari" />
            <input
              className="input"
              value={cariCepat}
              onChange={e => setCariCepat(e.target.value)}
              placeholder="Cari pasal atau kata kunci…"
              aria-label="Pencarian cepat"
            />
            <span className="pintasan">
              <span className="kbd">Ctrl</span><span className="kbd">K</span>
            </span>
          </form>

          <span className="spacer" />

          <button
            className="btn btn-icon btn-ghost"
            onClick={toggleTema}
            aria-label={tema === 'gelap' ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
            title={tema === 'gelap' ? 'Tema terang' : 'Tema gelap'}
          >
            {tema === 'gelap' ? <IkonMatahari size={17} /> : <IkonTema size={17} />}
          </button>
        </header>

        <main className="konten" id="konten-utama">
          {rute.nama === 'dashboard' && <Dashboard />}
          {rute.nama === 'baca' && <Reader nomor={rute.pasal} />}
          {rute.nama === 'cari' && <SearchPage qAwal={rute.q} />}
          {rute.nama === 'daftar-isi' && <TocPage />}
          {rute.nama === 'pustaka' && <LibraryPage />}
          {rute.nama === 'pemetaan' && <MappingPage />}
          {rute.nama === 'catatan' && <NotesPage />}
          {rute.nama === 'analisis' && <AnalysisPage idAwal={rute.id} />}
          {rute.nama === 'asisten' && <AssistantPage />}
          {rute.nama === 'kalkulator' && <CalculatorPage />}
          {rute.nama === 'ekspor' && <ExportPage />}
          {rute.nama === 'pengaturan' && <SettingsPage />}
          {rute.nama === 'tentang' && <AboutPage />}
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette />
      <ToastHost />

    </div>
  )
}
