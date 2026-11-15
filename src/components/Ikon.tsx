/* ============================================================
   Ikon — SVG inline, tanpa dependensi eksternal.
   Garis 1.75px, sudut membulat, ukuran mengikuti font-size.
   ============================================================ */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...rest}
    >
      {children}
    </svg>
  )
}

export const IkonCari = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></Svg>
)
export const IkonRumah = (p: P) => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-6h5v6" /></Svg>
)
export const IkonBuku = (p: P) => (
  <Svg {...p}><path d="M4 4.5A2 2 0 0 1 6 2.5h13v19H6a2 2 0 0 1-2-2z" /><path d="M4 18.5h15" /><path d="M8 6.5h7" /><path d="M8 10h7" /></Svg>
)
export const IkonDaftar = (p: P) => (
  <Svg {...p}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3.5 6h.01" /><path d="M3.5 12h.01" /><path d="M3.5 18h.01" /></Svg>
)
export const IkonSimpan = (p: P) => (
  <Svg {...p}><path d="M6 3.5h12a1 1 0 0 1 1 1v16l-7-4.5-7 4.5v-16a1 1 0 0 1 1-1Z" /></Svg>
)
export const IkonSimpanIsi = (p: P) => (
  <Svg {...p} fill="currentColor"><path d="M6 3.5h12a1 1 0 0 1 1 1v16l-7-4.5-7 4.5v-16a1 1 0 0 1 1-1Z" /></Svg>
)
export const IkonCatatan = (p: P) => (
  <Svg {...p}><path d="M15.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9.5" /><path d="M15.5 3.5 20 8v4.5" /><path d="M15.5 3.5V8H20" /><path d="M8 12h5" /><path d="M8 16h4" /><circle cx="17.5" cy="17" r="3.2" /><path d="m19.8 19.3 1.7 1.7" /></Svg>
)
export const IkonPemetaan = (p: P) => (
  <Svg {...p}><rect x="3" y="3" width="7" height="6" rx="1.5" /><rect x="14" y="3" width="7" height="6" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /><rect x="14" y="15" width="7" height="6" rx="1.5" /><path d="M10 6h4" /><path d="M6.5 9v6" /><path d="M17.5 9v6" /><path d="M10 18h4" /></Svg>
)
export const IkonAsisten = (p: P) => (
  <Svg {...p}><path d="M12 3v2.5" /><rect x="4" y="5.5" width="16" height="12" rx="3.5" /><path d="M9.5 11h.01" /><path d="M14.5 11h.01" /><path d="M9.5 14.5h5" /><path d="M8.5 17.5V21" /><path d="M15.5 17.5V21" /></Svg>
)
export const IkonEkspor = (p: P) => (
  <Svg {...p}><path d="M12 3v12" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></Svg>
)
export const IkonPengaturan = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.07A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.07A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.9 4.6 1.7 1.7 0 0 0 10 3.04V3a2 2 0 1 1 4 0v.07A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.07a1.7 1.7 0 0 0-1.53 1Z" /></Svg>
)
export const IkonTema = (p: P) => (
  <Svg {...p}><path d="M20.5 14.2A8.6 8.6 0 1 1 9.8 3.5a6.9 6.9 0 0 0 10.7 10.7Z" /></Svg>
)
export const IkonMatahari = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2" /><path d="M12 19.5v2" /><path d="M4.2 4.2l1.5 1.5" /><path d="M18.3 18.3l1.5 1.5" /><path d="M2.5 12h2" /><path d="M19.5 12h2" /><path d="M4.2 19.8l1.5-1.5" /><path d="M18.3 5.7l1.5-1.5" /></Svg>
)
export const IkonMenu = (p: P) => (
  <Svg {...p}><path d="M4 6.5h16" /><path d="M4 12h16" /><path d="M4 17.5h16" /></Svg>
)
export const IkonTutup = (p: P) => (
  <Svg {...p}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></Svg>
)
export const IkonKiri = (p: P) => (
  <Svg {...p}><path d="m14.5 5-7 7 7 7" /></Svg>
)
export const IkonKanan = (p: P) => (
  <Svg {...p}><path d="m9.5 5 7 7-7 7" /></Svg>
)
export const IkonBawah = (p: P) => (
  <Svg {...p}><path d="m5 9.5 7 7 7-7" /></Svg>
)
export const IkonSalin = (p: P) => (
  <Svg {...p}><rect x="8.5" y="8.5" width="12" height="12" rx="2.2" /><path d="M15.5 5.5A2 2 0 0 0 13.5 3.5h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2" /></Svg>
)
export const IkonCetak = (p: P) => (
  <Svg {...p}><path d="M7 8.5V3.5h10v5" /><rect x="3.5" y="8.5" width="17" height="7.5" rx="2" /><path d="M7 13.5h10v7H7z" /></Svg>
)
export const IkonBagikan = (p: P) => (
  <Svg {...p}><circle cx="18" cy="5.5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="18.5" r="2.6" /><path d="m8.4 10.8 7.2-4" /><path d="m8.4 13.2 7.2 4" /></Svg>
)
export const IkonPerbesar = (p: P) => (
  <Svg {...p}><path d="M4.5 9.5v-5h5" /><path d="M19.5 9.5v-5h-5" /><path d="M4.5 14.5v5h5" /><path d="M19.5 14.5v5h-5" /></Svg>
)
export const IkonPerkecil = (p: P) => (
  <Svg {...p}><path d="M9.5 4.5v5h-5" /><path d="M14.5 4.5v5h5" /><path d="M9.5 19.5v-5h-5" /><path d="M14.5 19.5v-5h5" /></Svg>
)
export const IkonPerisai = (p: P) => (
  <Svg {...p}><path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" /><path d="m9 12 2 2 4-4" /></Svg>
)
export const IkonPeringatan = (p: P) => (
  <Svg {...p}><path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4" /><path d="M12 17h.01" /></Svg>
)
export const IkonInfo = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.8" /><path d="M12 11v5.5" /><path d="M12 7.8h.01" /></Svg>
)
export const IkonCentang = (p: P) => (
  <Svg {...p}><path d="m4.5 12.5 5 5 10-11" /></Svg>
)
export const IkonJam = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.8" /><path d="M12 7v5.2l3.4 2" /></Svg>
)
export const IkonTautan = (p: P) => (
  <Svg {...p}><path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11.6 6.7" /><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.5-1.5" /></Svg>
)
export const IkonSaring = (p: P) => (
  <Svg {...p}><path d="M3.5 5.5h17" /><path d="M6.5 12h11" /><path d="M10 18.5h4" /></Svg>
)
export const IkonSampah = (p: P) => (
  <Svg {...p}><path d="M4.5 6.5h15" /><path d="M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" /><path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" /><path d="M10.5 10.5v6" /><path d="M13.5 10.5v6" /></Svg>
)
export const IkonTambah = (p: P) => (
  <Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>
)
export const IkonUnduh = (p: P) => (
  <Svg {...p}><path d="M12 3.5v11" /><path d="m8 11 4 4 4-4" /><path d="M4.5 17v2.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V17" /></Svg>
)
export const IkonSorot = (p: P) => (
  <Svg {...p}><path d="M11 4.5 8.6 15.5a3 3 0 0 1-1.3 1.9L5 18.8" /><path d="M7 9h9" /><path d="M4 21h17" /><circle cx="17" cy="7" r="3" /></Svg>
)
export const IkonSkala = (p: P) => (
  <Svg {...p}><path d="M12 4v16" /><path d="M8 20h8" /><path d="M5 8h14" /><path d="M5 8 2.5 14h5z" /><path d="M19 8l-2.5 6h5z" /><path d="M12 4a1.6 1.6 0 1 0 0-1.2" /></Svg>
)
export const IkonPalu = (p: P) => (
  <Svg {...p}><path d="m13.5 3.5 7 7-2.5 2.5-7-7z" /><path d="m11 6 3-3" /><path d="M10.5 9.5 4 16v4.5h4.5l6.5-6.5" /></Svg>
)
export const IkonKunci = (p: P) => (
  <Svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /><path d="M12 14.5v2.5" /></Svg>
)
export const IkonBintang = (p: P) => (
  <Svg {...p}><path d="m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z" /></Svg>
)
export const IkonPena = (p: P) => (
  <Svg {...p}><path d="M4 20.5 4.7 16 16.2 4.5a2.1 2.1 0 0 1 3 0l1.3 1.3a2.1 2.1 0 0 1 0 3L9 20.3z" /><path d="m15 5.8 3.2 3.2" /></Svg>
)
export const IkonGrafik = (p: P) => (
  <Svg {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-4" /><path d="M12.5 16V8" /><path d="M17 16v-6.5" /></Svg>
)
export const IkonBerkas = (p: P) => (
  <Svg {...p}><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" /><path d="M14 3.5v5h5" /></Svg>
)
export const IkonFilterX = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.8" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></Svg>
)
export const IkonTarget = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></Svg>
)
export const IkonTopik = (p: P) => (
  <Svg {...p}><path d="M4 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.5h7A1.5 1.5 0 0 1 20 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" /></Svg>
)
export const IkonPetir = (p: P) => (
  <Svg {...p}><path d="M13.5 2.5 5 14h6l-1.5 7.5L19 9.5h-6z" /></Svg>
)

export const IkonFuzzy = (p: P) => (
  <Svg {...p}><path d="M4 17c3 0 3-10 6-10s3 10 6 10" /><path d="M20.5 6.5 17 10l3.5 3.5" /></Svg>
)
