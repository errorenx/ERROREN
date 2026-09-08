import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-screen"
          className="min-h-screen w-full flex items-center justify-center p-4"
          style={{
            backgroundColor: '#070d1a',
            color: '#f0f6fc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            className="w-full max-w-md p-6 sm:p-8 rounded-2xl border text-center shadow-2xl space-y-4"
            style={{
              backgroundColor: '#0d172e',
              borderColor: '#1e325c',
            }}
          >
            <div
              className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#ef4444',
                color: '#ef4444',
              }}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h1 className="text-lg font-bold tracking-tight">ERROREN Encountered an Issue</h1>

            <p className="text-xs leading-relaxed" style={{ color: '#9bb0d1' }}>
              The application encountered an unexpected runtime error. You can reload the page or reset cached session data to restore full functionality.
            </p>

            {this.state.error && (
              <div
                className="p-3 rounded-lg text-left text-[11px] font-mono overflow-x-auto border max-h-28"
                style={{
                  backgroundColor: '#070d1a',
                  borderColor: '#1e325c',
                  color: '#f87171',
                }}
              >
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: '#00d2ff',
                  color: '#021020',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleResetData}
                className="px-4 py-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors opacity-80 hover:opacity-100"
                style={{
                  backgroundColor: '#122040',
                  borderColor: '#1e325c',
                  color: '#9bb0d1',
                }}
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
