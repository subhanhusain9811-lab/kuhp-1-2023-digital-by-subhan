/* ============================================================
   State global (Zustand + persist)
   Tema, preferensi baca, bookmark, riwayat, catatan, analisis, UI.
   Semua tersimpan lokal di perangkat (localStorage).
   ============================================================ */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Bookmark, CatatanPribadi, RiwayatBaca, Preferensi, AnalisisHukum, Tema, Rute,
} from '@/lib/types'
import { ruteKeHash } from '@/lib/router'

const PENYIMPANAN = createJSONStorage(() => ({
  getItem: (k: string) => {
    try { return localStorage.getItem(k) } catch { return null }
  },
  setItem: (k: string, v: string) => {
    try { localStorage.setItem(k, v) } catch { /* kuota penuh */ }
  },
  removeItem: (k: string) => {
    try { localStorage.removeItem(k) } catch { /* noop */ }
  },
}))

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const PREFERENSI_AWAL: Preferensi = {
  ukuranHuruf: 1,
  lebarBaca: 680,
  jarakBaris: 1.72,
  modeFokus: false,
  tampilkanPenjelasan: true,
  tampilkanAncaman: true,
  tampilkanKoreksi: true,
  tampilkanRujukan: true,
  simpanRiwayat: true,
}

interface State {
  tema: Tema
  preferensi: Preferensi
  setTema: (t: Tema) => void
  toggleTema: () => void
  setPreferensi: (p: Partial<Preferensi>) => void
  resetPreferensi: () => void

  rute: Rute
  navigasi: (r: Rute, gantiRiwayat?: boolean) => void
  sinkronHash: (r: Rute) => void

  bookmark: Bookmark[]
  toggleBookmark: (pasal: number, catatan?: string) => boolean
  hapusBookmark: (id: string) => void
  ubahBookmark: (id: string, patch: Partial<Bookmark>) => void
  isBookmark: (pasal: number) => boolean

  riwayat: RiwayatBaca[]
  catatBaca: (pasal: number, ayat?: number | null) => void
  hapusRiwayat: (pasal: number) => void
  kosongkanRiwayat: () => void

  riwayatCari: string[]
  catatCari: (q: string) => void
  hapusCari: (q: string) => void
  kosongkanCari: () => void

  catatan: CatatanPribadi[]
  tambahCatatan: (c: Pick<CatatanPribadi, 'pasal' | 'isi'> & Partial<CatatanPribadi>) => string
  ubahCatatan: (id: string, patch: Partial<CatatanPribadi>) => void
  hapusCatatan: (id: string) => void

  analisis: AnalisisHukum[]
  buatAnalisis: (judul: string, fakta?: string) => string
  ubahAnalisis: (id: string, patch: Partial<AnalisisHukum>) => void
  hapusAnalisis: (id: string) => void

  sidebarBuka: boolean
  setSidebar: (b: boolean) => void
  paletBuka: boolean
  setPalet: (b: boolean) => void

  toast: { id: number; pesan: string; jenis: 'ok' | 'info' | 'galat' } | null
  tampilkanToast: (pesan: string, jenis?: 'ok' | 'info' | 'galat') => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      tema: 'terang',
      preferensi: { ...PREFERENSI_AWAL },
      setTema: (t) => set({ tema: t }),
      toggleTema: () => set({ tema: get().tema === 'terang' ? 'gelap' : 'terang' }),
      setPreferensi: (p) => set({ preferensi: { ...get().preferensi, ...p } }),
      resetPreferensi: () => set({ preferensi: { ...PREFERENSI_AWAL } }),

      rute: { nama: 'dashboard' },
      navigasi: (r, gantiRiwayat = false) => {
        set({ rute: r, sidebarBuka: false, paletBuka: false })
        if (typeof window === 'undefined') return
        const hash = ruteKeHash(r)
        if (window.location.hash !== hash) {
          if (gantiRiwayat) window.history.replaceState(null, '', hash)
          else window.history.pushState(null, '', hash)
        }
        const k = document.querySelector('.konten')
        if (k) k.scrollTop = 0
        window.scrollTo({ top: 0 })
      },
      sinkronHash: (r) => set({ rute: r, sidebarBuka: false, paletBuka: false }),

      bookmark: [],
      toggleBookmark: (pasal, catatan) => {
        const ada = get().bookmark.find(b => b.pasal === pasal)
        if (ada) {
          set({ bookmark: get().bookmark.filter(b => b.id !== ada.id) })
          return false
        }
        set({
          bookmark: [{
            id: uid(), pasal, ayat: null, catatan: catatan ?? '',
            dibuat: Date.now(), tag: [],
          }, ...get().bookmark],
        })
        return true
      },
      hapusBookmark: (id) => set({ bookmark: get().bookmark.filter(b => b.id !== id) }),
      ubahBookmark: (id, patch) => set({
        bookmark: get().bookmark.map(b => (b.id === id ? { ...b, ...patch } : b)),
      }),
      isBookmark: (pasal) => get().bookmark.some(b => b.pasal === pasal),

      riwayat: [],
      catatBaca: (pasal, ayat) => {
        if (!get().preferensi.simpanRiwayat) return
        const lama = get().riwayat.filter(r => r.pasal !== pasal)
        set({
          riwayat: [{ pasal, ayat: ayat ?? null, dibaca: Date.now() }, ...lama].slice(0, 60),
        })
      },
      hapusRiwayat: (pasal) => set({ riwayat: get().riwayat.filter(r => r.pasal !== pasal) }),
      kosongkanRiwayat: () => set({ riwayat: [] }),

      riwayatCari: [],
      catatCari: (q) => {
        const t = q.trim()
        if (t.length < 2) return
        set({
          riwayatCari: [t, ...get().riwayatCari.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 25),
        })
      },
      hapusCari: (q) => set({ riwayatCari: get().riwayatCari.filter(x => x !== q) }),
      kosongkanCari: () => set({ riwayatCari: [] }),

      catatan: [],
      tambahCatatan: (c) => {
        const id = uid()
        const kini = Date.now()
        set({
          catatan: [{
            id, pasal: c.pasal, ayat: c.ayat ?? null, huruf: c.huruf ?? null,
            isi: c.isi, label: c.label ?? [], dibuat: kini, diubah: kini,
          }, ...get().catatan],
        })
        return id
      },
      ubahCatatan: (id, patch) => set({
        catatan: get().catatan.map(c => (c.id === id ? { ...c, ...patch, diubah: Date.now() } : c)),
      }),
      hapusCatatan: (id) => set({ catatan: get().catatan.filter(c => c.id !== id) }),

      analisis: [],
      buatAnalisis: (judul, fakta) => {
        const id = uid()
        const kini = Date.now()
        set({
          analisis: [{
            id, judul, fakta: fakta ?? '', pasalTerkait: [], unsur: [],
            catatan: '', dibuat: kini, diubah: kini,
          }, ...get().analisis],
        })
        return id
      },
      ubahAnalisis: (id, patch) => set({
        analisis: get().analisis.map(a => (a.id === id ? { ...a, ...patch, diubah: Date.now() } : a)),
      }),
      hapusAnalisis: (id) => set({ analisis: get().analisis.filter(a => a.id !== id) }),

      sidebarBuka: false,
      setSidebar: (b) => set({ sidebarBuka: b }),
      paletBuka: false,
      setPalet: (b) => set({ paletBuka: b }),

      toast: null,
      tampilkanToast: (pesan, jenis = 'ok') => {
        const id = Date.now()
        set({ toast: { id, pesan, jenis } })
        setTimeout(() => {
          if (get().toast?.id === id) set({ toast: null })
        }, 2600)
      },
    }),
    {
      name: 'kuhp:store',
      version: 1,
      storage: PENYIMPANAN,
      partialize: (s) => ({
        tema: s.tema,
        preferensi: s.preferensi,
        bookmark: s.bookmark,
        riwayat: s.riwayat,
        riwayatCari: s.riwayatCari,
        catatan: s.catatan,
        analisis: s.analisis,
      }),
    },
  ),
)

/** Terapkan tema ke <html> mengikuti preferensi. */
export function pakaiTema() {
  const tema = useStore(s => s.tema)
  if (typeof document === 'undefined') return
  const akar = document.documentElement
  const gelapSistem = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const gelap = tema === 'gelap' || (tema === 'sistem' && gelapSistem)
  akar.setAttribute('data-tema', gelap ? 'gelap' : 'terang')
  akar.style.colorScheme = gelap ? 'dark' : 'light'
}
