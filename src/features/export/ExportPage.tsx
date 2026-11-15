/* ============================================================
   Ekspor & Cetak
   - Rentang pasal, satu pasal, atau seluruh bab
   - Format: TXT (teks polos) / HTML dokumen / cetak PDF
   - Menyertakan sumber, tetapi tidak pernah mengubah redaksi
   ============================================================ */
import { useMemo, useState } from 'react'
import { db, htmlKeTeks } from '@/lib/data'
import { useStore } from '@/store/useStore'
import { unduh } from '@/lib/format'
import { Kartu, Tombol, Label, Segmen, Info } from '@/components/ui'
import {
  IkonEkspor, IkonCetak, IkonUnduh, IkonBerkas, IkonPerisai,
  IkonInfo, IkonBuku, IkonJam,
} from '@/components/Ikon'

type Format = 'txt' | 'html'

export function ExportPage() {
  const tampilkanToast = useStore(s => s.tampilkanToast)

  const [dari, setDari] = useState('1')
  const [sampai, setSampai] = useState('10')
  const [format, setFormat] = useState<Format>('txt')
  const [denganPenjelasan, setDenganPenjelasan] = useState(true)
  const [denganAncaman, setDenganAncaman] = useState(true)

  const rentang = useMemo(() => {
    const a = Math.max(1, Math.min(624, parseInt(dari, 10) || 1))
    const b = Math.max(a, Math.min(624, parseInt(sampai, 10) || a))
    return { a, b }
  }, [dari, sampai])

  const pasalList = useMemo(
    () => db.pasal.filter(p => p.nomor >= rentang.a && p.nomor <= rentang.b),
    [rentang],
  )

  const kata = useMemo(
    () => pasalList.reduce((n, p) => n + htmlKeTeks(p.teks).split(' ').length, 0),
    [pasalList],
  )

  const bangunTeks = () => {
    const baris: string[] = []
    baris.push('='.repeat(72))
    baris.push('KUHP DIGITAL — Kutipan Undang-Undang Nomor 1 Tahun 2023')
    baris.push('tentang Kitab Undang-Undang Hukum Pidana')
    baris.push('='.repeat(72))
    baris.push('')
    baris.push(`Rentang: Pasal ${rentang.a} sampai Pasal ${rentang.b}`)
    baris.push(`Jumlah: ${pasalList.length} pasal`)
    baris.push(`Diundangkan: ${db.meta.diundangkan} · ${db.meta.lembaranNegara}`)
    baris.push(`Sumber data: ${db.meta.sumber.utama}`)
    baris.push(`Verifikasi: ${db.meta.sumber.verifikasi}`)
    baris.push(`Diekspor: ${new Date().toLocaleString('id-ID')}`)
    baris.push('')
    baris.push('CATATAN: Redaksi pasal disalin apa adanya. Ringkasan ancaman pidana')
    baris.push('dihasilkan otomatis dan bukan bagian dari teks undang-undang.')
    baris.push('')

    let babLalu = ''
    for (const p of pasalList) {
      const kunciBab = `${p.buku}|${p.bab}`
      if (kunciBab !== babLalu) {
        babLalu = kunciBab
        baris.push('')
        baris.push('-'.repeat(72))
        baris.push(`${p.buku === 'BUKU KESATU' ? 'BUKU KESATU' : 'BUKU KEDUA'} — BAB ${p.bab}`)
        baris.push(p.babJudul)
        baris.push('-'.repeat(72))
        baris.push('')
      }
      baris.push(`Pasal ${p.nomor}`)
      if (p.bagianJudul) baris.push(`[Bagian ${p.bagian} — ${p.bagianJudul}]`)
      if (p.paragrafJudul) baris.push(`[Paragraf ${p.paragraf} — ${p.paragrafJudul}]`)
      baris.push('')

      const berayat = p.ayat.filter(a => a.nomor != null)
      if (berayat.length === 0) {
        baris.push(wrap(htmlKeTeks(p.teks), 88))
      } else {
        for (const a of p.ayat) {
          if (a.nomor != null) baris.push(wrap(`(${a.nomor}) ${htmlKeTeks(a.teks)}`, 88, 4))
          else baris.push(wrap(htmlKeTeks(a.teks), 88))
          if (!/<li[\s>]/i.test(a.teks)) {
            for (const h of a.huruf) baris.push(wrap(`${h.label}. ${htmlKeTeks(h.teks)}`, 88, 6))
          }
        }
      }

      if (denganAncaman && (p.ancaman.mati || p.ancaman.seumurHidup || p.ancaman.penjara || p.ancaman.denda)) {
        const bagian: string[] = []
        if (p.ancaman.mati) bagian.push('pidana mati')
        if (p.ancaman.seumurHidup) bagian.push('penjara seumur hidup')
        for (const [j, v] of p.ancaman.penjara ?? []) bagian.push(`penjara paling ${j} ${v} tahun`)
        for (const it of p.ancaman.denda ?? []) bagian.push(`denda kategori ${it[1] ?? '-'}`)
        baris.push('')
        baris.push(`[Ringkasan ancaman — bukan kutipan resmi]: ${bagian.join('; ')}`)
      }

      if (denganPenjelasan) {
        const penj = htmlKeTeks(p.penjelasan)
        baris.push('')
        baris.push('PENJELASAN:')
        baris.push(wrap(penj, 88, 2))
      }

      if (p.adaKoreksi) {
        baris.push('')
        baris.push(`[Catatan: redaksi pasal ini memuat ${p.jumlahKoreksi} koreksi terhadap berkas sumber; lihat log koreksi.]`)
      }

      baris.push('')
      baris.push('')
    }

    baris.push('='.repeat(72))
    baris.push('Akhir kutipan. Dokumen ini bukan nasihat hukum.')
    baris.push('Sumber resmi: Undang-Undang Nomor 1 Tahun 2023 tentang KUHP.')
    baris.push('='.repeat(72))
    return baris.join('\n')
  }

  const bangunHtml = () => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const isiPasal = pasalList.map(p => {
      const berayat = p.ayat.filter(a => a.nomor != null)
      let badan = ''
      if (berayat.length === 0) {
        badan = `<p class="ayat">${esc(htmlKeTeks(p.teks))}</p>`
      } else {
        badan = p.ayat.map(a => {
          const no = a.nomor != null ? `<span class="no">(${a.nomor})</span> ` : ''
          const huruf = a.huruf.length && !/<li[\s>]/i.test(a.teks)
            ? `<ol class="huruf">${a.huruf.map(h => `<li><span class="lbl">${esc(h.label)}.</span> ${esc(htmlKeTeks(h.teks))}</li>`).join('')}</ol>`
            : ''
          return `<p class="ayat">${no}${esc(htmlKeTeks(a.teks))}</p>${huruf}`
        }).join('')
      }
      const penj = denganPenjelasan
        ? `<div class="penj"><h4>Penjelasan</h4><p>${esc(htmlKeTeks(p.penjelasan))}</p></div>`
        : ''
      return `<article class="pasal" id="p${p.nomor}">
  <h3>Pasal ${p.nomor}</h3>
  <div class="lokasi">${esc(p.buku)} · Bab ${esc(p.bab)} — ${esc(p.babJudul)}${p.bagianJudul ? ` · Bagian ${esc(p.bagian ?? '')} ${esc(p.bagianJudul)}` : ''}</div>
  ${badan}${penj}
</article>`
    }).join('\n')

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
<title>KUHP — Pasal ${rentang.a}–${rentang.b}</title>
<style>
  :root { --biru:#1B84B8; --teks:#16222E; --redup:#5C6B7A; --garis:#DDE5EC; }
  * { box-sizing:border-box }
  body { margin:0; padding:38px 30px; font-family:Georgia,'Times New Roman',serif; color:var(--teks); line-height:1.72; max-width:820px; margin-inline:auto; }
  header { border-bottom:3px solid var(--biru); padding-bottom:14px; margin-bottom:24px }
  header h1 { margin:0 0 4px; font-size:21px; letter-spacing:-.02em }
  header p { margin:2px 0; font-size:12px; color:var(--redup); font-family:system-ui,sans-serif }
  h2.bab { font-family:system-ui,sans-serif; font-size:14px; letter-spacing:.06em; text-transform:uppercase; color:var(--biru); border-bottom:1px solid var(--garis); padding-bottom:6px; margin:34px 0 14px }
  .pasal { margin:0 0 26px; page-break-inside:avoid }
  .pasal h3 { font-size:16px; margin:0 0 2px; font-family:system-ui,sans-serif }
  .lokasi { font-size:10.5px; color:var(--redup); font-family:system-ui,sans-serif; margin-bottom:9px; letter-spacing:.02em }
  .ayat { margin:0 0 8px; text-align:justify }
  .no { font-weight:700; color:var(--biru) }
  .huruf { list-style:none; padding-left:22px; margin:0 0 8px }
  .huruf li { margin-bottom:4px; text-align:justify }
  .lbl { font-weight:700 }
  .penj { background:#F7F9FB; border-left:3px solid var(--garis); padding:9px 13px; margin-top:10px; font-size:13.5px; color:#35475A }
  .penj h4 { margin:0 0 4px; font-family:system-ui,sans-serif; font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--redup) }
  .penj p { margin:0 }
  footer { margin-top:38px; padding-top:12px; border-top:1px solid var(--garis); font-size:11px; color:var(--redup); font-family:system-ui,sans-serif; line-height:1.7 }
  @media print { body { padding:0 } .pasal { page-break-inside:avoid } }
</style></head>
<body>
<header>
  <h1>Undang-Undang Nomor 1 Tahun 2023 tentang Kitab Undang-Undang Hukum Pidana</h1>
  <p>Rentang Pasal ${rentang.a}–${rentang.b} · ${pasalList.length} pasal</p>
  <p>Diundangkan ${esc(db.meta.diundangkan)} · ${esc(db.meta.lembaranNegara)}</p>
  <p>Diekspor dari KUHP DIGITAL pada ${new Date().toLocaleString('id-ID')}</p>
</header>
${isiPasal}
<footer>
  Redaksi pasal disalin apa adanya dari sumber resmi. Ringkasan ancaman pidana, bila ada,
  dihasilkan otomatis dan bukan bagian dari teks undang-undang. Dokumen ini bukan nasihat hukum.
</footer>
</body></html>`
  }

  const lakukanEkspor = () => {
    if (pasalList.length === 0) { tampilkanToast('Tidak ada pasal pada rentang ini', 'galat'); return }
    const nama = `KUHP-pasal-${rentang.a}-${rentang.b}.${format}`
    if (format === 'txt') unduh(nama, bangunTeks(), 'text/plain;charset=utf-8')
    else unduh(nama, bangunHtml(), 'text/html;charset=utf-8')
    tampilkanToast(`${pasalList.length} pasal diekspor sebagai ${format.toUpperCase()}`)
  }

  const cetak = () => {
    if (pasalList.length === 0) { tampilkanToast('Tidak ada pasal untuk dicetak', 'galat'); return }
    const w = window.open('', '_blank')
    if (!w) { tampilkanToast('Popup diblokir. Gunakan ekspor HTML lalu cetak.', 'galat'); return }
    w.document.write(bangunHtml())
    w.document.close()
    setTimeout(() => w.print(), 350)
  }

  return (
    <div className="konten-dalam anim-up">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', marginBottom: 4 }}>
          Ekspor & Cetak
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 700 }}>
          Unduh atau cetak redaksi resmi dalam tata letak dokumen. Redaksi tidak diubah; ringkasan
          ancaman selalu diberi penanda agar tidak tertukar dengan teks undang-undang.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Pengaturan */}
        <Kartu>
          <Label>Rentang Pasal</Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
            <input className="input" value={dari} onChange={e => setDari(e.target.value)}
              inputMode="numeric" aria-label="Pasal awal" style={{ maxWidth: 100 }} />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>sampai</span>
            <input className="input" value={sampai} onChange={e => setSampai(e.target.value)}
              inputMode="numeric" aria-label="Pasal akhir" style={{ maxWidth: 100 }} />
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              ['1', '10', 'Pasal 1–10'],
              ['1', '187', 'Buku Kesatu'],
              ['188', '624', 'Buku Kedua'],
              ['476', '481', 'Bab Pencurian'],
              ['1', '624', 'Seluruh KUHP'],
            ].map(([a, b, l]) => (
              <button key={l} className="chip"
                onClick={() => { setDari(a); setSampai(b) }}
                style={{ cursor: 'pointer', fontSize: 11, padding: '5px 10px', fontWeight: 650 }}>
                {l}
              </button>
            ))}
          </div>

          <Label>Format</Label>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Segmen<Format>
              nilai={format} label="Format ekspor"
              opsi={[{ nilai: 'txt', label: 'Teks (.txt)' }, { nilai: 'html', label: 'Dokumen (.html)' }]}
              onUbah={setFormat}
            />
          </div>

          <Label>Isi</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 9 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={denganPenjelasan} onChange={e => setDenganPenjelasan(e.target.checked)} />
              Sertakan penjelasan pasal
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={denganAncaman} onChange={e => setDenganAncaman(e.target.checked)} />
              Sertakan ringkasan ancaman (diberi penanda)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 7, marginTop: 18, flexWrap: 'wrap' }}>
            <Tombol nada="primary" ikon={<IkonUnduh size={14} />} onClick={lakukanEkspor}>
              Unduh {format.toUpperCase()}
            </Tombol>
            <Tombol ikon={<IkonCetak size={14} />} onClick={cetak}>Cetak / PDF</Tombol>
          </div>
        </Kartu>

        {/* Pratinjau info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Kartu>
            <div className="row-gap" style={{ marginBottom: 10 }}>
              <IkonBerkas size={15} style={{ color: 'var(--brand-700)' }} />
              <Label>Ringkasan Berkas</Label>
            </div>
            <Info label="Pasal" nilai={`${rentang.a} – ${rentang.b} (${pasalList.length} pasal)`} />
            <Info label="Perkiraan kata" nilai={kata.toLocaleString('id-ID')} />
            <Info label="Format" nilai={format === 'txt' ? 'Teks polos (.txt)' : 'Dokumen HTML (.html)'} />
            <Info label="Penjelasan" nilai={denganPenjelasan ? 'Disertakan' : 'Tidak disertakan'} />
            <Info label="Ringkasan ancaman" nilai={denganAncaman ? 'Disertakan (diberi penanda)' : 'Tidak disertakan'} />
            <Info label="Bab tercakup" nilai={new Set(pasalList.map(p => p.bab)).size} />
          </Kartu>

          {pasalList.length > 0 && (
            <Kartu>
              <div className="row-gap" style={{ marginBottom: 9 }}>
                <IkonBuku size={15} style={{ color: 'var(--muted)' }} />
                <Label>Cuplikan</Label>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 5 }}>
                PASAL {pasalList[0].nomor} · {pasalList[0].babJudul}
              </div>
              <p style={{
                fontFamily: 'var(--font-doc)', fontSize: 12.5, lineHeight: 1.65,
                color: 'var(--text-soft)', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {htmlKeTeks(pasalList[0].teks)}
              </p>
              {pasalList.length > 1 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  …dan {pasalList.length - 1} pasal lainnya
                </div>
              )}
            </Kartu>
          )}

          <Kartu style={{ background: 'var(--surface-2)' }}>
            <div className="row-gap" style={{ marginBottom: 7 }}>
              <IkonPerisai size={14} style={{ color: 'var(--muted)' }} />
              <Label>Integritas Ekspor</Label>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7 }}>
              <li>Teks pasal diambil langsung dari dataset, tanpa pemformatan ulang isi.</li>
              <li>Ringkasan ancaman diberi label "bukan kutipan resmi".</li>
              <li>Setiap berkas mencantumkan sumber dan waktu ekspor.</li>
              <li>Untuk PDF, gunakan dialog cetak → "Simpan sebagai PDF".</li>
            </ul>
          </Kartu>

          <Kartu>
            <div className="row-gap" style={{ marginBottom: 7 }}>
              <IkonJam size={14} style={{ color: 'var(--muted)' }} />
              <Label>Cetak Satu Pasal</Label>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 9 }}>
              Untuk mencetak satu pasal saja beserta tata letak baca khusus, buka pasal tersebut
              lalu tekan tombol Cetak.
            </p>
            <Tombol kecil ikon={<IkonEkspor size={12} />}
              onClick={() => useStore.getState().navigasi({ nama: 'baca', pasal: Math.min(624, Math.max(1, parseInt(dari, 10) || 1)) })}>
              Buka Pasal {Math.min(624, Math.max(1, parseInt(dari, 10) || 1))}
            </Tombol>
          </Kartu>
        </div>
      </div>

      <Kartu style={{ marginTop: 18, background: 'var(--surface-2)', display: 'flex', gap: 8 }}>
        <IkonInfo size={14} style={{ color: 'var(--muted)', flex: 'none', marginTop: 2 }} />
        <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>
          Salinan digital ini disediakan untuk memudahkan penelusuran. Untuk keperluan resmi, selalu
          rujuk lembaran negara: {db.meta.lembaranNegara}.
        </p>
      </Kartu>
    </div>
  )
}

/* pembungkus teks sederhana agar rapi di berkas .txt */
function wrap(teks: string, lebar: number, indent = 0): string {
  const kata = teks.split(/\s+/)
  const baris: string[] = []
  let kini = ' '.repeat(indent)
  for (const k of kata) {
    if (kini.length + k.length + 1 > lebar && kini.trim().length > 0) {
      baris.push(kini)
      kini = ' '.repeat(indent) + k
    } else {
      kini += (kini.trim().length ? ' ' : '') + k
    }
  }
  if (kini.trim().length) baris.push(kini)
  return baris.join('\n')
}
