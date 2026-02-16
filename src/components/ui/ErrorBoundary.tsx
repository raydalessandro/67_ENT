import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Qualcosa è andato storto</h2>
            <p className="text-gray-400 text-sm mb-4">
              Si è verificato un errore imprevisto.
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm
                         hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Ricarica pagina
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
