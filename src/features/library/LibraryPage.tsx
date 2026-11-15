/* ============================================================
   Pustaka Saya — Bookmark & Riwayat Baca
   ============================================================ */
import { useMemo, useState } from 'react'
import { db, htmlKeTeks } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { waktuRelatif, ringkasAncaman, adaAncaman } from '@/lib/format'
import { Kartu, Chip, Tombol, Kosong, Segmen, Modal } from '@/components/ui'
import {
  IkonSimpan, IkonJam, IkonCari, IkonSampah, IkonPena,
  IkonSalin, IkonTutup, IkonBuku,
} from '@/components/Ikon'
import { salin } from '@/lib/storage'
import { kutipPasal } from '@/lib/format'

type Tab = 'bookmark' | 'riwayat'

export function LibraryPage() {
  const navigasi = useStore(s => s.navigasi)
  const bookmark = useStore(s => s.bookmark)
  const hapusBookmark = useStore(s => s.hapusBookmark)
  const ubahBookmark = useStore(s => s.ubahBookmark)
  const riwayat = useStore(s => s.riwayat)
  const hapusRiwayat = useStore(s => s.hapusRiwayat)
  const kosongkanRiwayat = useStore(s => s.kosongkanRiwayat)
  const tampilkanToast = useStore(s => s.tampilkanToast)

  const [tab, setTab] = useState<Tab>('bookmark')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<{ id: string; catatan: string } | null>(null)

  const saring = <T,>(arr: T[], ambilTeks: (x: T) => string) => {
    const t = q.trim().toLowerCase()
    if (!t) return arr
    return arr.filter(x => ambilTeks(x).toLowerCase().includes(t))
  }

  const bm = useMemo(() => saring(bookmark, b => {
    const p = db.get(b.pasal)
    return `${p?.nomor ?? ''} ${p?.babJudul ?? ''} ${b.catatan} ${b.tag.join(' ')}`
  }), [bookmark, q])

  const rw = useMemo(() => saring(riwayat, r => {
    const p = db.get(r.pasal)
    return `${p?.nomor ?? ''} ${p?.babJudul ?? ''}`
  }), [riwayat, q])

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 4 }}>
          Pustaka Saya
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Bookmark dan riwayat baca tersimpan di perangkat ini. Tidak ada data yang dikirim keluar.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <Segmen<Tab>
          nilai={tab}
          label="Pilih pustaka"
          opsi={[
            { nilai: 'bookmark', label: `Bookmark (${bookmark.length})` },
            { nilai: 'riwayat', label: `Riwayat (${riwayat.length})` },
          ]}
          onUbah={setTab}
        />
        <div className="topbar-cari" style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
          <IkonCari size={15} className="ikon-cari" />
          <input
            className="input" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Saring…" aria-label="Saring pustaka"
            style={{ minHeight: 36, paddingLeft: 33 }}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Bersihkan"
              style={{ position: 'absolute', right: 9, color: 'var(--muted)' }}>
              <IkonTutup size={14} />
            </button>
          )}
        </div>
        {tab === 'riwayat' && riwayat.length > 0 && (
          <Tombol kecil nada="danger" ikon={<IkonSampah size={13} />} onClick={() => {
            if (confirm('Hapus seluruh riwayat baca?')) { kosongkanRiwayat(); tampilkanToast('Riwayat dihapus') }
          }}>
            Hapus semua
          </Tombol>
        )}
      </div>

      {tab === 'bookmark' && (
        bm.length === 0 ? (
          <Kartu>
            <Kosong
              ikon={<IkonSimpan size={24} />}
              judul={q ? 'Tidak ada bookmark yang cocok' : 'Belum ada bookmark'}
              pesan="Tandai pasal penting saat membaca; pasal tersimpan akan muncul di sini lengkap dengan catatan Anda."
              aksi={<Tombol nada="primary" onClick={() => navigasi({ nama: 'baca', pasal: 1 })}>Mulai membaca</Tombol>}
            />
          </Kartu>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {bm.map(b => {
              const p = db.get(b.pasal)
              if (!p) return null
              return (
                <Kartu key={b.id} pad={0} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <button onClick={() => navigasi({ nama: 'baca', pasal: p.nomor })}
                        style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand-700)' }}>
                        Pasal {p.nomor}
                      </button>
                      <Chip>Bab {p.bab}</Chip>
                      <span className="spacer" />
                      <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>
                        {waktuRelatif(b.dibuat)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 5 }}>
                      {p.babJudul}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-doc)', fontSize: 13, lineHeight: 1.55,
                      color: 'var(--text-soft)', margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {htmlKeTeks(p.teks)}
                    </p>

                    {b.catatan && (
                      <div style={{
                        marginTop: 9, padding: '8px 10px', borderRadius: 8,
                        background: 'var(--brand-50)', fontSize: 12.5, lineHeight: 1.6,
                        color: 'var(--text-soft)', borderLeft: '3px solid var(--brand-400)',
                      }}>
                        {b.catatan}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                      {adaAncaman(p.ancaman) && (
                        <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>
                          {ringkasAncaman(p)}
                        </span>
                      )}
                      <span className="spacer" />
                      <Tombol kecil nada="ghost" ikon={<IkonPena size={12} />}
                        onClick={() => setEdit({ id: b.id, catatan: b.catatan })}>
                        Catatan
                      </Tombol>
                      <Tombol kecil nada="ghost" ikon={<IkonSalin size={12} />} onClick={async () => {
                        const ok = await salin(kutipPasal(p))
                        tampilkanToast(ok ? 'Pasal disalin' : 'Gagal menyalin', ok ? 'ok' : 'galat')
                      }}>
                        Salin
                      </Tombol>
                      <Tombol kecil nada="danger" ikon={<IkonSampah size={12} />} onClick={() => {
                        hapusBookmark(b.id); tampilkanToast('Bookmark dihapus')
                      }}>
                        Hapus
                      </Tombol>
                    </div>
                  </div>
                </Kartu>
              )
            })}
          </div>
        )
      )}

      {tab === 'riwayat' && (
        rw.length === 0 ? (
          <Kartu>
            <Kosong
              ikon={<IkonJam size={24} />}
              judul={q ? 'Tidak ada riwayat yang cocok' : 'Riwayat masih kosong'}
              pesan="Setiap pasal yang Anda buka akan tercatat di sini agar mudah dilanjutkan. Anda dapat mematikan pencatatan di Pengaturan."
            />
          </Kartu>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rw.map(r => {
              const p = db.get(r.pasal)
              if (!p) return null
              return (
                <div key={r.pasal} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flex: 'none', display: 'grid', placeItems: 'center',
                    background: 'var(--surface-2)', color: 'var(--muted)',
                  }}>
                    <IkonBuku size={15} />
                  </div>
                  <button onClick={() => navigasi({ nama: 'baca', pasal: p.nomor })}
                    style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Pasal {p.nomor}</div>
                    <div className="truncate" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{p.babJudul}</div>
                  </button>
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650, flex: 'none' }}>
                    {waktuRelatif(r.dibaca)}
                  </span>
                  <button onClick={() => hapusRiwayat(r.pasal)} aria-label={`Hapus riwayat pasal ${p.nomor}`}
                    style={{ color: 'var(--muted)', padding: 4, flex: 'none' }}>
                    <IkonTutup size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )
      )}

      <Modal buka={!!edit} onTutup={() => setEdit(null)} judul="Catatan Bookmark">
        <textarea
          className="input" autoFocus value={edit?.catatan ?? ''}
          onChange={e => setEdit(v => (v ? { ...v, catatan: e.target.value } : v))}
          placeholder="Mengapa pasal ini penting?"
          style={{ minHeight: 120 }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <Tombol onClick={() => setEdit(null)}>Batal</Tombol>
          <Tombol nada="primary" onClick={() => {
            if (edit) { ubahBookmark(edit.id, { catatan: edit.catatan }); tampilkanToast('Catatan disimpan') }
            setEdit(null)
          }}>Simpan</Tombol>
        </div>
      </Modal>
    </div>
  )
}
