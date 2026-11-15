/* ============================================================
   Kit UI bersama: Chip, Kartu, Baris statistik, Kosongkan, Modal,
   Segmented, Toast host, dll.
   ============================================================ */
import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { useStore } from '@/store/useStore'
import { IkonTutup, IkonInfo, IkonCentang, IkonPeringatan } from './Ikon'

/* ---------- Chip ---------- */
export function Chip({
  children, nada = 'netral', ikon, judul,
}: {
  children: ReactNode
  nada?: 'netral' | 'brand' | 'ok' | 'warn' | 'danger'
  ikon?: ReactNode
  judul?: string
}) {
  const kelas = {
    netral: 'chip', brand: 'chip chip-brand', ok: 'chip chip-ok',
    warn: 'chip chip-warn', danger: 'chip chip-danger',
  }[nada]
  return (
    <span className={kelas} title={judul}>
      {ikon}{children}
    </span>
  )
}

/* ---------- Kartu ---------- */
export function Kartu({
  children, pad = 16, kelas = '', ...rest
}: { children: ReactNode; pad?: number; kelas?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${kelas}`} style={{ padding: pad }} {...rest}>
      {children}
    </div>
  )
}

/* ---------- Tombol dengan status aktif ---------- */
export function Tombol({
  aktif, kecil, ikon, children, nada = 'netral', ...rest
}: {
  aktif?: boolean
  kecil?: boolean
  ikon?: ReactNode
  nada?: 'netral' | 'primary' | 'ghost' | 'danger'
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const kelas = [
    'btn',
    kecil ? 'btn-sm' : '',
    nada === 'primary' ? 'btn-primary' : '',
    nada === 'ghost' ? 'btn-ghost' : '',
    nada === 'danger' ? 'btn-danger' : '',
  ].filter(Boolean).join(' ')
  return (
    <button
      className={kelas}
      aria-pressed={aktif}
      style={aktif ? { background: 'var(--brand-50)', borderColor: 'var(--brand-200)', color: 'var(--brand-700)' } : undefined}
      {...rest}
    >
      {ikon}{children}
    </button>
  )
}

/* ---------- Segmented control ---------- */
export function Segmen<T extends string | number>({
  nilai, opsi, onUbah, label,
}: {
  nilai: T
  opsi: { nilai: T; label: string }[]
  onUbah: (v: T) => void
  label?: string
}) {
  return (
    <div
      role="group" aria-label={label}
      style={{
        display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
      }}
    >
      {opsi.map(o => (
        <button
          key={String(o.nilai)}
          onClick={() => onUbah(o.nilai)}
          aria-pressed={nilai === o.nilai}
          style={{
            minHeight: 30, padding: '0 11px', borderRadius: 7, fontSize: 'var(--fs-xs)',
            fontWeight: 650,
            background: nilai === o.nilai ? 'var(--surface)' : 'transparent',
            color: nilai === o.nilai ? 'var(--brand-700)' : 'var(--muted)',
            boxShadow: nilai === o.nilai ? 'var(--shadow-xs)' : 'none',
            transition: 'all 140ms var(--ease)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Empty state ---------- */
export function Kosong({
  ikon, judul, pesan, aksi,
}: { ikon?: ReactNode; judul: string; pesan?: string; aksi?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '44px 20px', gap: 10,
    }}>
      {ikon && (
        <div style={{
          width: 54, height: 54, borderRadius: 16, display: 'grid', placeItems: 'center',
          background: 'var(--surface-2)', color: 'var(--muted)', marginBottom: 4,
        }}>{ikon}</div>
      )}
      <div style={{ fontWeight: 700, fontSize: 'var(--fs-lg)' }}>{judul}</div>
      {pesan && (
        <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', maxWidth: 420, lineHeight: 1.6 }}>
          {pesan}
        </div>
      )}
      {aksi && <div style={{ marginTop: 8 }}>{aksi}</div>}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({
  buka, onTutup, judul, children, lebar = 520,
}: {
  buka: boolean
  onTutup: () => void
  judul: string
  children: ReactNode
  lebar?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!buka) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    document.addEventListener('keydown', onKey)
    const asal = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      asal?.focus?.()
    }
  }, [buka, onTutup])

  if (!buka) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 95, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(10,20,28,.5)', backdropFilter: 'blur(3px)',
        animation: 'fadeIn 140ms var(--ease) both',
      }}
      onClick={e => { if (e.target === e.currentTarget) onTutup() }}
      role="presentation"
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        style={{
          width: `min(${lebar}px, 100%)`, maxHeight: '88vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, boxShadow: 'var(--shadow-lg)',
          animation: 'popIn 170ms var(--ease) both', outline: 'none',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 15px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: 750, fontSize: 'var(--fs-lg)' }}>{judul}</div>
          <button className="btn btn-icon btn-ghost" style={{ marginLeft: 'auto' }} onClick={onTutup} aria-label="Tutup">
            <IkonTutup size={18} />
          </button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

/* ---------- Toast host ---------- */
export function ToastHost() {
  const toast = useStore(s => s.toast)
  if (!toast) return null
  const ikon = toast.jenis === 'galat' ? <IkonPeringatan size={16} />
    : toast.jenis === 'info' ? <IkonInfo size={16} /> : <IkonCentang size={16} />
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <div className="toast">{ikon}{toast.pesan}</div>
    </div>
  )
}

/* ---------- Label bagian ---------- */
export function Label({ children }: { children: ReactNode }) {
  return (
    <span style={{
      fontSize: 'var(--fs-2xs)', fontWeight: 700, letterSpacing: '.06em',
      textTransform: 'uppercase', color: 'var(--muted)',
    }}>{children}</span>
  )
}

/* ---------- Baris info kecil ---------- */
export function Info({ label, nilai }: { label: string; nilai: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border)', alignItems: 'baseline' }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, minWidth: 130 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 550, flex: 1, minWidth: 0 }}>{nilai}</div>
    </div>
  )
}
