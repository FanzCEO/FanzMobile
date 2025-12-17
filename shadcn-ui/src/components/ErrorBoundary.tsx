import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

// Helper to serialize any error type
function serializeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}\n${err.stack || ''}`;
  }
  if (typeof err === 'object' && err !== null) {
    try {
      // Try to get constructor name
      const name = (err as Record<string, unknown>).constructor?.name || 'Object';
      // Try JSON stringify
      const json = JSON.stringify(err, null, 2);
      if (json === '{}') {
        // Empty object - try to get own properties
        const props = Object.getOwnPropertyNames(err)
          .map((k) => `${k}: ${String((err as Record<string, unknown>)[k])}`)
          .join(', ');
        return `[${name}] { ${props || 'empty'} }`;
      }
      return `[${name}] ${json}`;
    } catch {
      return `[Object] ${String(err)}`;
    }
  }
  return String(err);
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: '',
  };

  private unsubscribe?: () => void;

  componentDidMount() {
    const handleGlobalError = (event: ErrorEvent) => {
      // Capture unexpected runtime errors (outside React render)
      const errMsg = serializeError(event.error || event.message);
      console.error('[ErrorBoundary] Global error:', errMsg);
      this.setState({
        hasError: true,
        error: event.error || new Error(event.message),
        errorInfo: errMsg,
      });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errMsg = serializeError(event.reason);
      console.error('[ErrorBoundary] Unhandled rejection:', errMsg);
      const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.setState({ hasError: true, error: err, errorInfo: errMsg });
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    this.unsubscribe = () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  public static getDerivedStateFromError(error: unknown): State {
    const errMsg = serializeError(error);
    console.error('[ErrorBoundary] getDerivedStateFromError:', errMsg);
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      errorInfo: errMsg,
    };
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    const errMsg = serializeError(error);
    console.error('[ErrorBoundary] componentDidCatch:', errMsg, errorInfo);
    this.setState((prev) => ({
      ...prev,
      errorInfo: `${errMsg}\n\nComponent Stack:${errorInfo.componentStack}`,
    }));
  }

  public render() {
    if (this.state.hasError) {
      const displayError =
        this.state.errorInfo ||
        this.state.error?.stack ||
        this.state.error?.message ||
        'Unknown error';

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#000',
            color: '#fff',
          }}
        >
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              Something went wrong
            </h1>
            <pre
              style={{
                textAlign: 'left',
                backgroundColor: '#1a1a1a',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px',
                marginBottom: '16px',
                maxHeight: '400px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {displayError}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                borderRadius: '6px',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
