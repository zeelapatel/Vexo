'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Vexo] Canvas error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050507' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F5F3F0', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', marginBottom: 24, fontFamily: 'monospace' }}>
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: '#C4F042', color: '#050507', border: 'none', borderRadius: 7, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
