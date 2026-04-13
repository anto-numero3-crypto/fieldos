'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRefresh = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const isDev = process.env.NODE_ENV !== 'production'

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-100 bg-white shadow-sm p-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Une erreur est survenue</h2>
          <p className="text-sm text-gray-500 mb-5">Veuillez rafraîchir la page.</p>
          <button
            type="button"
            onClick={this.handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            <RefreshCw className="h-4 w-4" /> Rafraîchir
          </button>
          {isDev && this.state.error && (
            <pre className="mt-5 max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-left text-[11px] text-gray-100 whitespace-pre-wrap break-words">
              {this.state.error.stack || this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
