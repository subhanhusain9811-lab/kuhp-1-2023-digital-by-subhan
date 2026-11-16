/* ============================================================
   Router berbasis hash (tanpa dependensi)
   Contoh: #/pasal/476  #/pasal/476/ayat/2  #/cari?q=pencurian
           #/daftar-isi  #/pemetaan  #/asisten  #/tentang
   ============================================================ */
import type { Rute } from './types'

export function ruteKeHash(r: Rute): string {
  switch (r.nama) {
    case 'dashboard': return '#/'
    case 'baca': return r.ayat != null ? `#/pasal/${r.pasal}/ayat/${r.ayat}` : `#/pasal/${r.pasal}`
    case 'cari': return r.q ? `#/cari?q=${encodeURIComponent(r.q)}` : '#/cari'
    case 'daftar-isi': return '#/daftar-isi'
    case 'pustaka': return '#/pustaka'
    case 'pemetaan': return '#/pemetaan'
    case 'catatan': return '#/catatan'
    case 'analisis': return r.id ? `#/analisis/${r.id}` : '#/analisis'
    case 'asisten': return '#/asisten'
    case 'ekspor': return '#/ekspor'
    case 'pengaturan': return '#/pengaturan'
    case 'tentang': return r.sub ? `#/tentang/${r.sub}` : '#/tentang'
    case 'penyesuaian': return '#/penyesuaian'
    default: return '#/'
  }
}

export function hashKeRute(hash: string): Rute {
  const bersih = hash.replace(/^#\/?/, '')
  const [jalur, kueri] = bersih.split('?')
  const seg = jalur.split('/').filter(Boolean)

  if (seg.length === 0) return { nama: 'dashboard' }

  switch (seg[0]) {
    case 'pasal': {
      const n = parseInt(seg[1] ?? '1', 10)
      const pasal = Number.isFinite(n) ? Math.min(624, Math.max(1, n)) : 1
      const ayat = seg[2] === 'ayat' ? parseInt(seg[3] ?? '', 10) : null
      return { nama: 'baca', pasal, ayat: Number.isFinite(ayat as number) ? ayat : null }
    }
    case 'cari': {
      const p = new URLSearchParams(kueri ?? '')
      return { nama: 'cari', q: p.get('q') ?? undefined }
    }
    case 'daftar-isi': return { nama: 'daftar-isi' }
    case 'pustaka': return { nama: 'pustaka' }
    case 'pemetaan': return { nama: 'pemetaan' }
    case 'catatan': return { nama: 'catatan' }
    case 'analisis': return { nama: 'analisis', id: seg[1] }
    case 'asisten': return { nama: 'asisten' }
    case 'ekspor': return { nama: 'ekspor' }
    case 'pengaturan': return { nama: 'pengaturan' }
    case 'tentang':
      return { nama: 'tentang', sub: (seg[1] as 'koreksi' | 'sumber' | undefined) }
    case 'penyesuaian': return { nama: 'penyesuaian' }
    default: return { nama: 'dashboard' }
  }
}
