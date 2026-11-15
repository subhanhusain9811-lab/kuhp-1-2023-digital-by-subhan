/* ============================================================
   Catatan Pribadi & Ruang Analisis
   ============================================================ */
import { useMemo, useState } from 'react'
import { db, htmlKeTeks } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { waktuRelatif, ringkasAncaman, adaAncaman, unduh, escapeHtml, sitasiFormalPasal } from '@/lib/format'
import { Kartu, Chip, Tombol, Kosong, Label, Modal, Segmen } from '@/components/ui'
import {
  IkonCatatan, IkonTambah, IkonSampah, IkonPena, IkonCari,
  IkonPemetaan, IkonSimpan, IkonTutup, IkonInfo, IkonPerisai, IkonUnduh, IkonCetak,
} from '@/components/Ikon'
import { klasifikasi } from '@/features/mapping/relasi'

/* ============================================================
   CATATAN
   ============================================================ */
export function NotesPage() {
  const navigasi = useStore(s => s.navigasi)
  const catatan = useStore(s => s.catatan)
  const hapusCatatan = useStore(s => s.hapusCatatan)
  const ubahCatatan = useStore(s => s.ubahCatatan)
  const tampilkanToast = useStore(s => s.tampilkanToast)

  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<{ id: string; isi: string } | null>(null)
  const [urut, setUrut] = useState<'baru' | 'pasal'>('baru')

  const tampil = useMemo(() => {
    const t = q.trim().toLowerCase()
    let arr = catatan
    if (t) {
      arr = arr.filter(c => {
        const p = db.get(c.pasal)
        return c.isi.toLowerCase().includes(t) ||
          String(c.pasal).includes(t) ||
          (p?.babJudul ?? '').toLowerCase().includes(t) ||
          c.label.some(l => l.toLowerCase().includes(t))
      })
    }
    return urut === 'pasal'
      ? [...arr].sort((a, b) => a.pasal - b.pasal)
      : arr
  }, [catatan, q, urut])

  return (
    <div className="konten-dalam anim-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="grow">
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 4 }}>
            Catatan Pribadi
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Catatan Anda terpisah dari redaksi resmi dan tersimpan hanya di perangkat ini.
          </p>
        </div>
        <Tombol nada="primary" ikon={<IkonTambah size={14} />} onClick={() => navigasi({ nama: 'baca', pasal: 1 })}>
          Tulis dari pasal
        </Tombol>
      </div>

      <div style={{ display: 'flex', gap: 9, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="topbar-cari" style={{ flex: 1, minWidth: 180, maxWidth: 340 }}>
          <IkonCari size={15} className="ikon-cari" />
          <input className="input" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cari dalam catatan…" aria-label="Cari catatan"
            style={{ minHeight: 36, paddingLeft: 33 }} />
          {q && (
            <button onClick={() => setQ('')} aria-label="Bersihkan"
              style={{ position: 'absolute', right: 9, color: 'var(--muted)' }}>
              <IkonTutup size={14} />
            </button>
          )}
        </div>
        <Segmen<'baru' | 'pasal'>
          nilai={urut} label="Urutkan catatan"
          opsi={[{ nilai: 'baru', label: 'Terbaru' }, { nilai: 'pasal', label: 'Nomor pasal' }]}
          onUbah={setUrut}
        />
      </div>

      {tampil.length === 0 ? (
        <Kartu>
          <Kosong
            ikon={<IkonCatatan size={24} />}
            judul={q ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan'}
            pesan="Saat membaca pasal, tekan tombol Catatan untuk menyimpan analisis, pertanyaan, atau pengingat."
            aksi={<Tombol nada="primary" onClick={() => navigasi({ nama: 'baca', pasal: 1 })}>Buka Pasal 1</Tombol>}
          />
        </Kartu>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {tampil.map(c => {
            const p = db.get(c.pasal)
            return (
              <Kartu key={c.id} pad={0} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <button onClick={() => navigasi({ nama: 'baca', pasal: c.pasal, ayat: c.ayat })}
                      style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-700)' }}>
                      Pasal {c.pasal}{c.ayat ? ` ayat (${c.ayat})` : ''}
                    </button>
                    {p && <Chip>Bab {p.bab}</Chip>}
                    <span className="spacer" />
                    <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>
                      {waktuRelatif(c.diubah)}
                    </span>
                  </div>
                  {p && (
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      {p.babJudul}
                    </div>
                  )}
                  <div style={{
                    fontSize: 13, lineHeight: 1.68, color: 'var(--text)', whiteSpace: 'pre-wrap',
                    paddingLeft: 10, borderLeft: '3px solid var(--brand-300)',
                  }}>
                    {c.isi}
                  </div>
                  {c.label.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {c.label.map(l => <Chip key={l} nada="brand">{l}</Chip>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 5, marginTop: 9, justifyContent: 'flex-end' }}>
                    <Tombol kecil nada="ghost" ikon={<IkonPena size={12} />}
                      onClick={() => setEdit({ id: c.id, isi: c.isi })}>Ubah</Tombol>
                    <Tombol kecil nada="danger" ikon={<IkonSampah size={12} />} onClick={() => {
                      hapusCatatan(c.id); tampilkanToast('Catatan dihapus')
                    }}>Hapus</Tombol>
                  </div>
                </div>
              </Kartu>
            )
          })}
        </div>
      )}

      <Modal buka={!!edit} onTutup={() => setEdit(null)} judul="Ubah Catatan">
        <textarea className="input" autoFocus value={edit?.isi ?? ''}
          onChange={e => setEdit(v => (v ? { ...v, isi: e.target.value } : v))}
          style={{ minHeight: 140 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <Tombol onClick={() => setEdit(null)}>Batal</Tombol>
          <Tombol nada="primary" onClick={() => {
            if (edit) { ubahCatatan(edit.id, { isi: edit.isi }); tampilkanToast('Catatan diperbarui') }
            setEdit(null)
          }}>Simpan</Tombol>
        </div>
      </Modal>
    </div>
  )
}

/* ============================================================
   RUANG ANALISIS
   ============================================================ */
export function AnalysisPage({ idAwal }: { idAwal?: string }) {
  const navigasi = useStore(s => s.navigasi)
  const analisis = useStore(s => s.analisis)
  const buatAnalisis = useStore(s => s.buatAnalisis)
  const ubahAnalisis = useStore(s => s.ubahAnalisis)
  const hapusAnalisis = useStore(s => s.hapusAnalisis)
  const tampilkanToast = useStore(s => s.tampilkanToast)

  const [aktifId, setAktifId] = useState<string | null>(idAwal ?? analisis[0]?.id ?? null)
  const [modalBaru, setModalBaru] = useState(false)
  const [judulBaru, setJudulBaru] = useState('')
  const [faktaBaru, setFaktaBaru] = useState('')

  const aktif = analisis.find(a => a.id === aktifId) ?? analisis[0]

  if (analisis.length === 0) {
    return (
      <div className="konten-dalam anim-up">
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 14 }}>
          Ruang Analisis
        </h1>
        <Kartu>
          <Kosong
            ikon={<IkonPemetaan size={24} />}
            judul="Belum ada berkas analisis"
            pesan="Ruang analisis membantu Anda menyusun uraian: fakta, dasar hukum, matriks unsur, dan kesimpulan — dengan pemisahan tegas antara kutipan resmi dan penalaran Anda."
            aksi={
              <Tombol nada="primary" ikon={<IkonTambah size={14} />} onClick={() => setModalBaru(true)}>
                Buat analisis baru
              </Tombol>
            }
          />
        </Kartu>
        <Modal buka={modalBaru} onTutup={() => setModalBaru(false)} judul="Analisis Baru">
          <AnalisisForm
            judul={judulBaru} fakta={faktaBaru}
            onJudul={setJudulBaru} onFakta={setFaktaBaru}
            onSimpan={() => {
              const id = buatAnalisis(judulBaru.trim() || 'Analisis tanpa judul', faktaBaru)
              setAktifId(id); setModalBaru(false); setJudulBaru(''); setFaktaBaru('')
              tampilkanToast('Berkas analisis dibuat')
            }}
          />
        </Modal>
      </div>
    )
  }

  return (
    <div className="konten-dalam anim-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em' }}>Ruang Analisis</h1>
        <span className="spacer" />
        <Tombol kecil nada="primary" ikon={<IkonTambah size={13} />} onClick={() => setModalBaru(true)}>
          Baru
        </Tombol>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* daftar berkas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {analisis.map(a => (
            <button key={a.id} onClick={() => setAktifId(a.id)}
              className={aktif?.id === a.id ? '' : 'card'}
              style={{
                textAlign: 'left', padding: '9px 11px', borderRadius: 9,
                background: aktif?.id === a.id ? 'var(--brand-50)' : undefined,
                border: '1px solid ' + (aktif?.id === a.id ? 'var(--brand-300)' : 'var(--border)'),
                color: aktif?.id === a.id ? 'var(--brand-700)' : 'var(--text)',
              }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>{a.judul}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                {a.pasalTerkait.length} pasal · {waktuRelatif(a.diubah)}
              </div>
            </button>
          ))}
        </div>

        {/* editor */}
        {aktif && (
          <AnalisisEditor
            key={aktif.id}
            a={aktif}
            onUbah={patch => ubahAnalisis(aktif.id, patch)}
            onHapus={() => {
              if (confirm('Hapus berkas analisis ini?')) {
                hapusAnalisis(aktif.id); setAktifId(null); tampilkanToast('Berkas dihapus')
              }
            }}
            onBukaPasal={n => navigasi({ nama: 'baca', pasal: n })}
            toast={tampilkanToast}
          />
        )}
      </div>

      <Modal buka={modalBaru} onTutup={() => setModalBaru(false)} judul="Analisis Baru">
        <AnalisisForm
          judul={judulBaru} fakta={faktaBaru}
          onJudul={setJudulBaru} onFakta={setFaktaBaru}
          onSimpan={() => {
            const id = buatAnalisis(judulBaru.trim() || 'Analisis tanpa judul', faktaBaru)
            setAktifId(id); setModalBaru(false); setJudulBaru(''); setFaktaBaru('')
            tampilkanToast('Berkas analisis dibuat')
          }}
        />
      </Modal>
    </div>
  )
}

function AnalisisForm({
  judul, fakta, onJudul, onFakta, onSimpan,
}: {
  judul: string; fakta: string
  onJudul: (v: string) => void; onFakta: (v: string) => void
  onSimpan: () => void
}) {
  return (
    <>
      <input className="input" autoFocus value={judul} onChange={e => onJudul(e.target.value)}
        placeholder="Judul analisis, mis. 'Kasus pencurian telepon seluler'" style={{ marginBottom: 10 }} />
      <textarea className="input" value={fakta} onChange={e => onFakta(e.target.value)}
        placeholder="Uraikan fakta singkat…" style={{ minHeight: 110 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <Tombol nada="primary" onClick={onSimpan}>Buat</Tombol>
      </div>
    </>
  )
}

function AnalisisEditor({
  a, onUbah, onHapus, onBukaPasal, toast,
}: {
  a: ReturnType<typeof useStore.getState>['analisis'][number]
  onUbah: (patch: Partial<typeof a>) => void
  onHapus: () => void
  onBukaPasal: (n: number) => void
  toast: (pesan: string, jenis?: 'ok' | 'info' | 'galat') => void
}) {
  const [nomorTambah, setNomorTambah] = useState('')
  const [judul, setJudul] = useState(a.judul)
  const [fakta, setFakta] = useState(a.fakta)
  const [catatan, setCatatan] = useState(a.catatan)

  const simpan = () => { onUbah({ judul, fakta, catatan }); toast('Analisis disimpan') }

  const bangunHtmlDokumen = () => {
    const pasalHtml = a.pasalTerkait.map(n => {
      const p = db.get(n)
      if (!p) return ''
      return `<div style="margin-bottom:12px;padding:10px;border:1px solid #d1d5db;border-radius:6px;">
        <p style="margin:0 0 4px;font-weight:bold;">${escapeHtml(sitasiFormalPasal(p))}</p>
        <p style="margin:0;line-height:1.6;">${escapeHtml(htmlKeTeks(p.teks))}</p>
        ${adaAncaman(p.ancaman) ? `<p style="margin:6px 0 0;font-size:11pt;color:#4b5563;"><i>Ancaman: ${escapeHtml(ringkasAncaman(p))}</i></p>` : ''}
      </div>`
    }).join('')

    const unsurHtml = a.unsur.length === 0 ? '' : `
      <h2>3. Matriks Unsur</h2>
      <table border="1" cellspacing="0" cellpadding="6" style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        <thead><tr style="background:#f3f4f6;"><th align="left">Unsur</th><th align="left">Uraian Analisis</th></tr></thead>
        <tbody>
          ${a.unsur.map(u => `<tr><td style="width:32%;font-weight:bold;">${escapeHtml(u.label)}</td><td>${escapeHtml(u.uraian || '—')}</td></tr>`).join('')}
        </tbody>
      </table>`

    return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(judul || 'Analisis Hukum')}</title>
      <style>body{font-family:Georgia,serif;max-width:760px;margin:32px auto;color:#111827;line-height:1.6;font-size:12pt;}h1{font-size:18pt;margin-bottom:4px;}h2{font-size:13pt;margin-top:18px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}.meta{color:#6b7280;font-size:10pt;margin-bottom:18px;}</style>
      </head><body>
      <h1>${escapeHtml(judul || 'Analisis Hukum KUHP')}</h1>
      <div class="meta">Disusun menggunakan KUHP Digital (UU No. 1 Tahun 2023) · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <h2>1. Fakta</h2>
      <p style="white-space:pre-wrap;">${escapeHtml(fakta || '—')}</p>
      <h2>2. Dasar Hukum (Redaksi Resmi UU No. 1 Tahun 2023)</h2>
      ${pasalHtml || '<p>Belum ada pasal yang ditambahkan.</p>'}
      ${unsurHtml}
      <h2>${a.unsur.length > 0 ? '4' : '3'}. Analisis &amp; Kesimpulan</h2>
      <p style="white-space:pre-wrap;">${escapeHtml(catatan || '—')}</p>
      </body></html>`
  }

  const eksporDoc = () => {
    const slug = (judul || 'analisis-kuhp').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'analisis-kuhp'
    unduh(`${slug}.doc`, bangunHtmlDokumen(), 'application/msword;charset=utf-8')
    toast('Dokumen analisis (.doc) diunduh')
  }

  const cetakAnalisis = () => {
    const w = window.open('', '_blank', 'width=860,height=720')
    if (!w) { toast('Izinkan pop-up untuk mencetak analisis', 'galat'); return }
    w.document.open()
    w.document.write(bangunHtmlDokumen())
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 200)
  }

  const tambahPasal = () => {
    const n = parseInt(nomorTambah, 10)
    if (!n || !db.get(n)) { toast('Nomor pasal tidak valid', 'galat'); return }
    if (a.pasalTerkait.includes(n)) { toast('Pasal sudah ada', 'info'); return }
    onUbah({ pasalTerkait: [...a.pasalTerkait, n].sort((x, y) => x - y) })
    setNomorTambah('')
  }

  const muatUnsur = () => {
    const unsur: typeof a.unsur = []
    for (const n of a.pasalTerkait) {
      const p = db.get(n)
      if (!p) continue
      const k = klasifikasi(p)
      for (const u of k.objektif) unsur.push({ label: `P${n} · ${u}`, uraian: '', dasar: 'analisis' })
      for (const u of k.subjektif) unsur.push({ label: `P${n} · ${u}`, uraian: '', dasar: 'analisis' })
    }
    const unik = unsur.filter((u, i, arr) => arr.findIndex(x => x.label === u.label) === i)
    onUbah({ unsur: unik })
    toast(`${unik.length} unsur dimuat dari penanda redaksi`)
  }

  return (
    <Kartu pad={0} style={{ overflow: 'hidden' }}>
      {/* kepala */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <input
          value={judul} onChange={e => setJudul(e.target.value)}
          style={{
            width: '100%', border: 0, background: 'transparent', outline: 'none',
            fontSize: 17, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--text)',
          }}
          aria-label="Judul analisis"
        />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
          Dibuat {waktuRelatif(a.dibuat)} · diperbarui {waktuRelatif(a.diubah)}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* fakta */}
        <section>
          <div className="row-gap" style={{ marginBottom: 6 }}>
            <Label>1 · Fakta</Label>
            <Chip nada="netral" judul="Uraian fakta berasal dari pengguna, bukan dari undang-undang">non-hukum</Chip>
          </div>
          <textarea className="input" value={fakta} onChange={e => setFakta(e.target.value)}
            placeholder="Uraikan kronologi/fakta yang relevan…" style={{ minHeight: 100, fontSize: 13 }} />
        </section>

        {/* dasar hukum */}
        <section>
          <div className="row-gap" style={{ marginBottom: 6 }}>
            <Label>2 · Dasar Hukum</Label>
            <Chip nada="ok" judul="Pasal diambil dari dataset resmi">redaksi resmi</Chip>
          </div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 9 }}>
            <input className="input" value={nomorTambah} onChange={e => setNomorTambah(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') tambahPasal() }}
              placeholder="Nomor pasal (1–624)" inputMode="numeric"
              style={{ maxWidth: 170, minHeight: 34, fontSize: 12.5 }} aria-label="Tambah pasal" />
            <Tombol kecil ikon={<IkonTambah size={12} />} onClick={tambahPasal}>Tambah</Tombol>
            {a.pasalTerkait.length > 0 && (
              <Tombol kecil nada="ghost" onClick={muatUnsur}>Muat matriks unsur</Tombol>
            )}
          </div>

          {a.pasalTerkait.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Belum ada pasal yang ditambahkan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {a.pasalTerkait.map(n => {
                const p = db.get(n)
                if (!p) return null
                return (
                  <div key={n} style={{
                    border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px',
                    background: 'var(--surface-2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <button onClick={() => onBukaPasal(n)}
                        style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-700)' }}>
                        Pasal {n}
                      </button>
                      <span className="grow truncate" style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650 }}>
                        {p.babJudul}
                      </span>
                      <button onClick={() => onUbah({ pasalTerkait: a.pasalTerkait.filter(x => x !== n) })}
                        aria-label={`Hapus pasal ${n}`} style={{ color: 'var(--muted)' }}>
                        <IkonTutup size={13} />
                      </button>
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-doc)', fontSize: 12, lineHeight: 1.55,
                      color: 'var(--text-soft)', margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {htmlKeTeks(p.teks)}
                    </p>
                    {adaAncaman(p.ancaman) && (
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 5, fontWeight: 650 }}>
                        {ringkasAncaman(p)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* matriks unsur */}
        {a.unsur.length > 0 && (
          <section>
            <div className="row-gap" style={{ marginBottom: 6 }}>
              <Label>3 · Matriks Unsur</Label>
              <Chip nada="warn" judul="Label unsur berasal dari penanda redaksi; kolom uraian adalah analisis Anda">label otomatis</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {a.unsur.map((u, i) => (
                <div key={u.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 190px) minmax(0, 1fr)', gap: 8 }}>
                  <div style={{
                    fontSize: 11.5, fontWeight: 700, padding: '7px 9px', borderRadius: 7,
                    background: 'var(--brand-50)', color: 'var(--brand-700)',
                  }}>{u.label}</div>
                  <input
                    className="input" value={u.uraian}
                    onChange={e => {
                      const unsur = [...a.unsur]
                      unsur[i] = { ...u, uraian: e.target.value }
                      onUbah({ unsur })
                    }}
                    placeholder="Terpenuhi / tidak terpenuhi — beserta alasannya…"
                    style={{ minHeight: 34, fontSize: 12.5 }}
                    aria-label={`Uraian unsur ${u.label}`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* kesimpulan */}
        <section>
          <div className="row-gap" style={{ marginBottom: 6 }}>
            <Label>{a.unsur.length > 0 ? '4' : '3'} · Analisis & Kesimpulan</Label>
            <Chip nada="netral">pendapat Anda</Chip>
          </div>
          <textarea className="input" value={catatan} onChange={e => setCatatan(e.target.value)}
            placeholder="Susun penalaran dan kesimpulan…" style={{ minHeight: 130, fontSize: 13 }} />
        </section>

        <div style={{
          display: 'flex', gap: 7, paddingTop: 4, borderTop: '1px solid var(--border)', flexWrap: 'wrap',
        }}>
          <Tombol nada="primary" ikon={<IkonSimpan size={13} />} onClick={simpan}>Simpan analisis</Tombol>
          <Tombol ikon={<IkonUnduh size={13} />} onClick={eksporDoc}>Ekspor Word (.doc)</Tombol>
          <Tombol ikon={<IkonCetak size={13} />} onClick={cetakAnalisis}>Cetak / PDF</Tombol>
          <Tombol nada="danger" ikon={<IkonSampah size={13} />} onClick={onHapus}>Hapus berkas</Tombol>
          <span className="spacer" />
          <span style={{ fontSize: 10.5, color: 'var(--muted)', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
            <IkonPerisai size={11} /> tersimpan lokal
          </span>
        </div>
      </div>

      <div style={{
        padding: '10px 16px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)',
        fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.6, display: 'flex', gap: 6,
      }}>
        <IkonInfo size={12} style={{ flex: 'none', marginTop: 1 }} />
        Kutipan pasal bersifat resmi; kolom fakta, uraian unsur, dan kesimpulan adalah analisis pengguna
        dan tidak memiliki kekuatan hukum mengikat.
      </div>
    </Kartu>
  )
}
