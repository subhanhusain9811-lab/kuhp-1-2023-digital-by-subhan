#!/usr/bin/env python3
"""
Bangun versi SATU BERKAS dari hasil `vite build`.

Alasan: build biasa menghasilkan modul ES (`.js` + `.css` terpisah). Peramban
MEMBLOKIR modul ES bila dibuka lewat `file://` (origin 'null'), sehingga
aplikasi tampil kosong. Dengan menanam CSS dan JS langsung ke dalam HTML,
berkas tunggal itu dapat dibuka tanpa server — cocok untuk USB, intranet
terbatas, atau komputer yang tidak boleh memasang apa pun.

Pemakaian:
    npm run build
    python3 scripts/build_tunggal.py
    -> dist/KUHP-DIGITAL-luring.html
"""
import base64
import re
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
# --dari <folder> untuk memilih hasil build tertentu (mis. dist-tunggal)
if '--dari' in sys.argv:
    DIST = AKAR / sys.argv[sys.argv.index('--dari') + 1]
else:
    DIST = AKAR / 'dist'
KELUARAN = DIST / 'KUHP-DIGITAL-luring.html'


def baca(p: Path) -> str:
    return p.read_text(encoding='utf-8')


def main() -> int:
    index = DIST / 'index.html'
    if not index.exists():
        print('dist/index.html tidak ada — jalankan `npm run build` dulu.', file=sys.stderr)
        return 1

    html = baca(index)

    # 1. CSS  -> <style>
    for m in re.finditer(r'<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', html):
        href = m.group(1)
        berkas = DIST / href.lstrip('./')
        if berkas.exists():
            css = baca(berkas)
            html = html.replace(m.group(0), '<style>\n' + css + '\n</style>')
            print('  CSS ditanam :', berkas.name, '(%d KB)' % (len(css) // 1024))

    # 2. modulepreload tidak relevan lagi setelah ditanam
    html = re.sub(r'\s*<link[^>]+rel="modulepreload"[^>]*>', '', html)

    # 3. JS   -> <script type="module"> ... </script>
    for m in re.finditer(r'<script[^>]*src="([^"]+)"[^>]*></script>', html):
        src = m.group(1)
        berkas = DIST / src.lstrip('./')
        if not berkas.exists():
            continue
        js = baca(berkas)
        # jaga-jaga: jangan sampai ada </script> di dalam kode
        js = js.replace('</script>', '<\\/script>')
        html = html.replace(m.group(0), '<script type="module">\n' + js + '\n</script>')
        print('  JS  ditanam :', berkas.name, '(%d KB)' % (len(js) // 1024))

    # 4. ikon + manifest ditanam sebagai data URI agar tidak ada permintaan berkas
    for pola, folder in ((r'href="(/?icons/[^"]+\.svg)"', DIST),
                         (r'href="(/?manifest\.webmanifest)"', DIST)):
        for m in re.finditer(pola, html):
            jalur = m.group(1).lstrip('/')
            berkas = folder / jalur
            if not berkas.exists():
                continue
            if jalur.endswith('.svg'):
                b64 = base64.b64encode(berkas.read_bytes()).decode()
                html = html.replace(m.group(0), 'href="data:image/svg+xml;base64,%s"' % b64)
            else:
                b64 = base64.b64encode(berkas.read_bytes()).decode()
                html = html.replace(
                    m.group(0),
                    'href="data:application/manifest+json;base64,%s"' % b64)

    # 5. service worker tidak berguna pada berkas tunggal
    html = re.sub(r'\s*<link[^>]+rel="manifest"[^>]*>', '', html)

    html = html.replace(
        '<head>',
        '<head>\n    <!-- Versi satu berkas: seluruh kode, gaya, dan data sudah tertanam.\n'
        '         Dapat dibuka langsung tanpa server. Data tetap tidak dikirim ke mana pun. -->')

    # 6. PEMERIKSAAN KETAT: SETIAP berkas .js/.css di folder build wajib sudah tertanam.
    #    Chunk tambahan (mis. data-*.js) dimuat lewat impor dinamis, bukan atribut src,
    #    jadi memeriksa atribut saja tidak cukup — akibatnya versi "satu berkas" bisa
    #    tampak jadi tetapi kosong saat dibuka lewat file:// (CORS origin 'null').
    folder_aset = DIST / 'assets'
    js_wajib, css_wajib = [], []
    if folder_aset.is_dir():
        for f in folder_aset.iterdir():
            if f.suffix == '.js': js_wajib.append(f.name)
            elif f.suffix == '.css': css_wajib.append(f.name)

    # semua bundel JS harus muncul utuh di dalam blok <script>
    blok_script = [m.group(1) for m in re.finditer(r'<script[^>]*>\s*(.*?)\s*</script>', html, re.S)]
    blok_gaya = [m.group(1) for m in re.finditer(r'<style[^>]*>(.*?)</style>', html, re.S)]

    hilang = []
    for nama in sorted(js_wajib):
        potongan = baca(folder_aset / nama)[:120]
        if not any(potongan[:60] in b for b in blok_script):
            hilang.append(nama)
    for nama in sorted(css_wajib):
        potongan = baca(folder_aset / nama)[:120]
        if not any(potongan[:60] in b for b in blok_gaya):
            hilang.append(nama)
    # tidak boleh ada lagi rujukan tag ke berkas luar
    for m in re.finditer(r'<(?:script|link)[^>]+(?:src|href)="([^"]*\.(?:js|css))"', html):
        hilang.append(m.group(1))

    if hilang:
        print('\nGAGAL: berkas berikut belum tertanam ke HTML:', hilang, file=sys.stderr)
        print('Bangun dengan: npx vite build --config vite.config.tunggal.ts --outDir dist-tunggal',
              file=sys.stderr)
        KELUARAN.unlink(missing_ok=True)
        return 1

    KELUARAN.write_text(html, encoding='utf-8')
    ukuran = KELUARAN.stat().st_size
    print('\nBerkas tunggal :', KELUARAN)
    print('Ukuran         : %.2f MB' % (ukuran / 1024 / 1024))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
