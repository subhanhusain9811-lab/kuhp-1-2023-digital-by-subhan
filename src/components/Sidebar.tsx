/* ============================================================
   Sidebar navigasi utama
   ============================================================ */
import { useStore } from '@/store/useStore'
import { db } from '@/lib/data'
import type { Rute } from '@/lib/types'
import {
  IkonRumah, IkonBuku, IkonDaftar, IkonCari, IkonSimpan, IkonPemetaan,
  IkonCatatan, IkonAsisten, IkonEkspor, IkonPengaturan, IkonPerisai,
  IkonSkala, IkonTema, IkonMatahari, IkonTutup, IkonInfo,
} from './Ikon'

export function Sidebar() {
  const rute = useStore(s => s.rute)
  const navigasi = useStore(s => s.navigasi)
  const setSidebar = useStore(s => s.setSidebar)
  const tema = useStore(s => s.tema)
  const toggleTema = useStore(s => s.toggleTema)
  const bookmark = useStore(s => s.bookmark)
  const catatan = useStore(s => s.catatan)
  const analisis = useStore(s => s.analisis)

  const aktif = (nama: Rute['nama']) => rute.nama === nama

  const item = (
    nama: Rute['nama'], label: string, ikon: React.ReactNode,
    badge?: number, r?: Rute,
  ) => (
    <button
      key={nama + label}
      className="nav-item"
      aria-current={aktif(nama) ? 'page' : undefined}
      onClick={() => navigasi(r ?? ({ nama } as Rute))}
    >
      <span style={{ color: aktif(nama) ? 'var(--brand-600)' : 'var(--muted)', display: 'flex' }}>{ikon}</span>
      <span className="grow truncate">{label}</span>
      {badge != null && badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
    </button>
  )

  return (
    <aside className="sidebar" aria-label="Navigasi utama">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <IkonSkala size={21} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="brand-name">KUHP <span style={{ color: 'var(--brand-600)' }}>Digital</span></div>
          <div className="brand-sub">UU No. 1 Tahun 2023</div>
        </div>
        <button
          className="btn btn-icon btn-ghost drawer-tutup"
          onClick={() => setSidebar(false)}
          aria-label="Tutup menu"
        >
          <IkonTutup size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {item('dashboard', 'Beranda', <IkonRumah size={19} />)}
        {item('cari', 'Pencarian', <IkonCari size={19} />)}

        <div className="nav-group-label">Baca KUHP</div>
        {item('daftar-isi', 'Daftar Isi', <IkonDaftar size={19} />)}
        {item('baca', 'Baca Pasal', <IkonBuku size={19} />, undefined, { nama: 'baca', pasal: 1 })}
        {item('pemetaan', 'Pemetaan Hukum', <IkonPemetaan size={19} />)}

        <div className="nav-group-label">Pustaka Saya</div>
        {item('pustaka', 'Bookmark & Riwayat', <IkonSimpan size={19} />, bookmark.length)}
        {item('catatan', 'Catatan Pribadi', <IkonCatatan size={19} />, catatan.length)}
        {item('analisis', 'Ruang Analisis', <IkonPemetaan size={19} />, analisis.length || undefined)}

        <div className="nav-group-label">Alat</div>
        {item('asisten', 'Asisten Hukum', <IkonAsisten size={19} />)}
        {item('kalkulator', 'Kalkulator Pidana', <IkonSkala size={19} />)}
        {item('ekspor', 'Ekspor & Cetak', <IkonEkspor size={19} />)}
        {item('pengaturan', 'Pengaturan', <IkonPengaturan size={19} />)}
        {item('tentang', 'Sumber & Integritas', <IkonPerisai size={19} />)}
      </nav>

      <div className="sidebar-foot">
        <div className="verifikasi-pill">
          <IkonPerisai size={14} style={{ flex: 'none', marginTop: 1 }} />
          <span>
            Redaksi terverifikasi<br />
            <span style={{ fontWeight: 500, opacity: .85 }}>{db.meta.statistik.pasal} pasal · {db.meta.statistik.pasalDikoreksi} pasal dikoreksi</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-sm grow"
            onClick={toggleTema}
            title={tema === 'gelap' ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
          >
            {tema === 'gelap' ? <IkonMatahari size={15} /> : <IkonTema size={15} />}
            {tema === 'gelap' ? 'Terang' : 'Gelap'}
          </button>
          <button
            className="btn btn-sm btn-icon"
            onClick={() => navigasi({ nama: 'tentang' })}
            title="Tentang aplikasi"
            aria-label="Tentang aplikasi"
          >
            <IkonInfo size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
