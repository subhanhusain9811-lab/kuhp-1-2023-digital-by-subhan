/* ============================================================
   ErrorBoundary — Penangkap galat tampilan agar aplikasi tidak blank
   ============================================================ */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { IkonPeringatan, IkonRumah } from './Ikon'

interface Props {
  children: ReactNode
  onBeranda?: () => void
}

interface State {
  galat: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { galat: null }

  static getDerivedStateFromError(galat: Error): State {
    return { galat }
  }

  componentDidCatch(galat: Error, info: ErrorInfo) {
    console.error('KUHP Digital ErrorBoundary:', galat, info)
  }

  render() {
    if (!this.state.galat) return this.props.children
    return (
      <div className="konten-dalam anim-up" style={{ maxWidth: 640 }}>
        <div className="card" style={{ padding: 22, borderColor: 'var(--danger)' }}>
          <div className="row-gap" style={{ marginBottom: 10, color: 'var(--danger)' }}>
            <IkonPeringatan size={20} />
            <h2 style={{ fontSize: 17, fontWeight: 800 }}>Terjadi Gangguan Tampilan</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 12 }}>
            Halaman ini mengalami kesalahan tak terduga. Data catatan dan bookmark lokal Anda tetap aman.
          </p>
          <pre
            className="mono"
            style={{
              fontSize: 11.5, padding: '10px 12px', borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--muted)', overflowX: 'auto', marginBottom: 14, whiteSpace: 'pre-wrap',
            }}
          >
            {this.state.galat.message || 'Kesalahan tidak diketahui'}
          </pre>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ galat: null })
                this.props.onBeranda?.()
              }}
            >
              <IkonRumah size={15} /> Kembali ke Beranda
            </button>
            <button className="btn" onClick={() => window.location.reload()}>
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      </div>
    )
  }
}
