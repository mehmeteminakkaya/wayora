import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] beklenmeyen hata:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page narrow">
          <section className="empty-state" role="alert">
            <p className="eyebrow">BEKLENMEYEN HATA</p>
            <h1>Sayfa açılamadı.</h1>
            <p>Bir şey ters gitti. Sayfayı yenileyerek tekrar deneyebilirsin.</p>
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
              Sayfayı yenile
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
