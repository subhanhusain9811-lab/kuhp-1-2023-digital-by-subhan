# PANDUAN DEPLOYMENT — KUHP DIGITAL v1.0.0

Aplikasi ini **sepenuhnya statis**. Tidak ada basis data, tidak ada API, tidak ada proses peladen yang perlu dijaga. Yang perlu dilakukan hanyalah menyajikan beberapa berkas.

> **Catatan kejujuran.** Setiap perintah dan skenario di bawah ini **benar-benar dijalankan dan diuji** saat paket ini disusun. Hal yang tidak dapat dipastikan (mis. konfigurasi penyedia hosting tertentu yang tidak diuji di sini) dinyatakan apa adanya.

---

## 1. Memilih cara pemasangan

| Skenario | Cara | Ukuran | Butuh server? |
|---|---|---|---|
| **A. Berkas tunggal (paling sederhana)** | Satu berkas HTML | 1,86 MB | **Tidak** |
| B. Hosting statis / intranet | Folder `dist/` | ±1,9 MB | Ya (statis) |
| C. Dijalankan dari sumber | `npm run build` | — | Ya (statis) |

Pilih **A** bila: ingin membagikan lewat USB/WhatsApp/email, memasang di komputer yang tidak boleh memasang server, atau ingin aplikasi yang benar-benar portabel.
Pilih **B** bila: memasang di intranet kantor, server web internal, atau hosting publik.

---

## 2. Skenario A — Berkas tunggal (tanpa server)

### 2.1 Membuat

```bash
cd kuhp-digital
npm install
npm run build:tunggal
```

Hasil: **`dist-tunggal/KUHP-DIGITAL-luring.html`** (1,86 MB).

Berkas ini memuat seluruh kode, gaya, ikon, dan **seluruh 624 pasal** di dalamnya — tidak ada berkas pendamping.

### 2.2 Memakai

Klik dua kali berkasnya, atau buka dengan peramban. Selesai.

**Diuji dan bekerja penuh** pada `file://`:

| Yang diuji | Hasil |
|---|---|
| Tampilan beranda | ✅ h1 “KUHP Digital”, 3.851 karakter |
| Membuka `#/pasal/476` | ✅ redaksi tampil |
| Pencarian `#/cari?q=pencurian` | ✅ hasil muncul |
| Bookmark, lalu muat ulang | ✅ bertahan (`localStorage` bekerja di `file://`) |
| Ekspor TXT | ✅ berkas terunduh, 13.754 karakter |
| Galat runtime | **0** |

**Batasan yang perlu diketahui pada mode berkas tunggal:**

- **Tidak dapat dipasang sebagai aplikasi** (PWA). Service worker tidak berfungsi pada `file://`, dan manifest ditanam sebagai data URI tetapi tidak diaktifkan. Ini tidak mengurangi fungsi apa pun — aplikasi sudah sepenuhnya luring karena seluruh data ada di dalam berkas.
- Data tersimpan **per-berkas-tempat**. Bila berkasnya dipindah ke folder lain, riwayat dan bookmark yang lama tidak ikut.
- Jangan mengubah nama berkas setelah dipakai; sebagian peramban mengaitkan data dengan jalur berkas.

### 2.3 Mengapa bukan build biasa?

Build biasa menghasilkan beberapa berkas `.js` sebagai **modul ES**. Peramban **memblokir** modul ES ketika dibuka lewat `file://` (kebijakan CORS, origin `null`) — halaman akan tampil kosong.

> Ini bukan dugaan: sudah diuji. Build biasa dibuka lewat `file://` menghasilkan
> `Access to script at 'file:///…/index-*.js' from origin 'null' has been blocked by CORS policy` dan halaman kosong.

Karena itu `build:tunggal` memakai `vite.config.tunggal.ts` dengan `inlineDynamicImports: true`, lalu `scripts/build_tunggal.py` menanam CSS dan JS ke dalam HTML.

---

## 3. Skenario B — Server statis

### 3.1 Membangun

```bash
cd kuhp-digital
npm install
npm run build      # hasil di dist/
```

Isi `dist/`:

```
dist/
├─ index.html
├─ manifest.webmanifest
├─ sw.js
├─ icons/            icon.svg, maskable.svg
└─ assets/           index-*.js, data-*.js, style-*.css
```

### 3.2 Menguji hasil build secara lokal

```bash
npm run preview    # http://localhost:4173
```

Perintah ini sudah diuji: halaman terbuka, service worker **terdaftar dan aktif**, 0 galat.

### 3.3 Menyajikan dengan server apa pun

Aplikasi memakai **hash router** (`#/pasal/476`), sehingga **tidak memerlukan aturan rewrite/fallback**. Server cukup menyajikan berkas apa adanya.

**Nginx**

```nginx
server {
    listen 80;
    server_name kuhp.contoh.id;
    root /var/www/kuhp-digital/dist;
    index index.html;

    # aset ber-hash boleh di-cache lama
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # service worker & manifest JANGAN di-cache lama
    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache";
    }

    # HTML selalu segar
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
```

**Apache** (`.htaccess` di dalam `dist/`)

```apache
<IfModule mod_headers.c>
  <FilesMatch "\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "(sw\.js|manifest\.webmanifest|index\.html)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
```

**Python (uji cepat di intranet)**

```bash
cd dist
python3 -m http.server 8080
```

> Diuji pada peladen Python: `/`, `/assets/`, `/manifest.webmanifest`, `/sw.js`, `/icons/icon.svg` semuanya **200**, service worker aktif.

### 3.4 Memasang di subfolder

Bila aplikasi dipasang di `https://contoh.id/kuhp/` (bukan akar domain):

```bash
npm run build -- --base=/kuhp/
```

Rute hash tetap bekerja tanpa konfigurasi tambahan.

### 3.5 GitHub Pages (subfolder) — sudah disiapkan

Repo ini memuat `.github/workflows/pages.yml` yang menerbitkan aplikasi ke
`https://<pengguna>.github.io/<nama-repo>/` setiap kali `main` diperbarui.

**Yang perlu dilakukan sekali saja:** di GitHub buka **Settings → Pages → Source**,
pilih **GitHub Actions**.

Workflow membaca `github.event.repository.name`, jadi nama repo boleh apa pun —
`--base=/<nama-repo>/` diisi otomatis.

**Mengapa ini butuh penanganan khusus.** GitHub Pages menyajikan repo dari
**subfolder**, bukan akar domain. Versi awal aplikasi meng-hardcode path ke akar
(`/sw.js`, `/icons/…`, `start_url: "/"`), sehingga pada subfolder service worker
akan gagal terdaftar dan mode luring mati. Perbaikannya:

| Berkas | Sebelum | Sesudah |
|---|---|---|
| `src/main.tsx` | `register('/sw.js')` | `register(\`${import.meta.env.BASE_URL}sw.js\`)` |
| `public/sw.js` | path literal `'/'`, `'/index.html'` | diturunkan dari `new URL('./', self.location)` |
| `public/manifest.webmanifest` | `start_url: "/"`, `scope: "/"` | `"."`, ikon relatif |
| `index.html` | `href="/icons/icon.svg"` | `href="./icons/icon.svg"` |

**Diuji pada dua skenario**, keduanya lulus:

| Skenario | Service worker | Mode luring |
|---|---|---|
| Akar domain (`http://127.0.0.1:8097/`) | `activated`, scope `/` | **3/3 halaman terbuka** |
| Subfolder (`http://127.0.0.1:8095/kuhp-digital/`) | `activated`, scope `/kuhp-digital/` | **3/3 halaman terbuka** |

Perilaku ini juga dikunci oleh uji otomatis (`npm run test:a11y`, 2 pemeriksaan
khusus kesadaran subfolder) agar tidak rusak diam-diam di kemudian hari.

### 3.6 Syarat agar PWA (pasang ke layar utama) berfungsi

1. **HTTPS wajib** — kecuali `localhost`. Peramban hanya mengaktifkan service worker pada konteks aman.
2. Berkas `sw.js` dan `manifest.webmanifest` harus dapat diakses dari akar situs.
3. Jangan menaruh aplikasi di balik autentikasi yang memblokir `sw.js`.

Setelah syarat terpenuhi, pengguna dapat memilih **Instal aplikasi** pada Chrome/Edge, atau **Tambahkan ke layar utama** pada Safari/Android.

---

## 4. Skenario C — Menjalankan dari sumber

Untuk pengembangan atau bila ingin mengubah data.

```bash
cd kuhp-digital
npm install        # sekali saja
npm run dev        # http://localhost:5173
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (hot reload) |
| `npm run build` | Build produksi → `dist/` |
| `npm run build:tunggal` | Build satu berkas → `dist-tunggal/KUHP-DIGITAL-luring.html` |
| `npm run preview` | Uji hasil build di port 4173 |
| `npm run typecheck` | Periksa tipe TypeScript (`tsc --noEmit`) |

**Prasyarat:** Node.js 18+ (diuji pada 20.20.2) dan npm 9+ (diuji pada 10.8.2).

> Pada server pengembangan, service worker **tidak** terpasang. Itu normal — fitur luring hanya aktif pada build produksi.

---

## 5. Daftar periksa setelah pemasangan

Lakukan lima pemeriksaan ini pada peramban sungguhan:

- [ ] **Beranda tampil** dan statistik menunjukkan `624 pasal`, `1.045 ayat`, `433 huruf`
- [ ] **Buka `#/pasal/477`** — daftar butir tampil `a. b. c. …` **tanpa label ganda** (`a. a.`), dan tidak ada butir yang terduplikasi
- [ ] **Cari “pencurian”** — muncul hasil dengan lencana *Kata Kunci* dan *Makna (Semantik)*
- [ ] **Mode luring** — matikan jaringan, muat ulang, aplikasi tetap terbuka (khusus skenario B dengan HTTPS)
- [ ] **Ekspor** — tombol *Unduh TXT* menghasilkan berkas

---

## 6. Pemecahan masalah

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Halaman **kosong** saat dibuka lewat `file://` | Modul ES diblokir CORS | Pakai `npm run build:tunggal` (§2) |
| Halaman kosong, 404 pada `/assets/...` | `base` salah untuk subfolder | Build ulang dengan `--base=/namafolder/` |
| **Tidak bisa dipasang** sebagai aplikasi | Bukan HTTPS, atau `sw.js` tidak terjangkau | Aktifkan HTTPS; pastikan `sw.js` di akar situs |
| Versi lama **terus muncul** setelah pembaruan | Service worker menyajikan cache lama | Naikkan `VERSI` di `public/sw.js`, lalu build ulang. Pengguna: `Ctrl + Shift + R` |
| Ikon tidak muncul di Android | `maskable.svg` tidak tersaji | Pastikan folder `icons/` ikut terunggah |
| Unduhan ekspor tidak terjadi | Peramban memblokir unduhan otomatis | Izinkan unduhan untuk situs ini |
| Data hilang setelah pembersihan peramban | Data memang lokal | Pulihkan dari cadangan yang diunduh lewat **Pengaturan** |

---

## 7. Pembaruan data

Bila teks undang-undang perlu diperbarui:

1. Ubah `src/data/kuhp-data.json` dan `src/data/koreksi.json`
2. Perbarui `meta.versiData` dan `meta.tanggalBangun`
3. Naikkan `VERSI` pada `public/sw.js` (mis. `kuhp-v1.0.1`) — **wajib**, agar cache lama tidak terus dipakai
4. Jalankan validasi dan pengujian:

```bash
python3 scripts/validate_canonical.py     # 39 pemeriksaan
npm run typecheck
npm run build && npm run preview
# di terminal lain, dengan aplikasi berjalan di 5173:
node tests/verify_membaca.mjs
node tests/e2e.mjs
node tests/aksesibilitas.mjs
```

5. Build ulang paket (`build` dan `build:tunggal`)

---

## 8. Keamanan dan privasi

- **Tidak ada data keluar.** Aplikasi tidak menghubungi domain mana pun; tidak ada analitik, tidak ada CDN, tidak ada telemetri. Diuji otomatis pada setiap rilis.
- **Tidak ada masukan pengguna yang dieksekusi.** HTML dari dataset disaring `sanitasiHtml()` (hanya `p, li, strong, em, b, i, br, ul, ol, span`; atribut `on*`, `style`, `href`, `src` dibuang).
- **Data pengguna hanya di peramban** (`localStorage` + IndexedDB). Tidak ada akun, tidak ada sinkronisasi.
- **Tidak butuh hak istimewa.** Cukup berkas statis; tidak ada proses, port khusus, atau layanan latar.

---

## 9. Yang tidak dicakup panduan ini

Dinyatakan terbuka agar tidak ada klaim berlebih:

- Konfigurasi khusus penyedia hosting tertentu (Vercel, Netlify, GitHub Pages, Cloudflare) — aplikasi statis dan hash-router, jadi umumnya cukup mengunggah `dist/`, tetapi **konfigurasi tersebut tidak diuji di sini**.
- Penerbitan sertifikat TLS.
- Pemasangan sebagai aplikasi desktop/native (mis. Electron). Tidak disediakan.
- Sinkronisasi antar-perangkat. **Tidak ada** dan tidak direncanakan pada v1.0.0.
